import { v4 as uuidv4 } from 'uuid';
import { AssessmentRepository } from '../repositories/assessment.repository';
import { ChallengeGeneratorService } from '../../challenge/services/challenge-generator.service';
import {
  CreateAssessmentRequest,
  AssessmentSessionResponse,
  AssessmentWorkspaceResponse,
  WorkspaceFile,
} from '../schemas/assessment.schema';
import {
  NotFoundError,
  SessionExpiredError,
  SubmissionNotAllowedError,
} from '../../../shared/errors/domain-errors';
import { StarterFile, TestFile } from '@hackerearth/ai';

export class AssessmentService {
  constructor(
    private readonly repository: AssessmentRepository,
    private readonly challengeGenerator: ChallengeGeneratorService,
  ) {}

  async createSession(
    input: CreateAssessmentRequest,
    userId: string = uuidv4(),
  ): Promise<AssessmentSessionResponse> {
    // 1. Generate challenge via AI Provider (Gemini / OpenAI / Claude)
    const challenge = await this.challengeGenerator.generate({
      technologies: input.technologies,
      difficulty: input.difficulty,
      reactDialect: input.reactDialect,
      modelId: input.modelId,
    });

    const hasLivePreview = input.technologies.some((t) => ['HTML', 'CSS', 'React'].includes(t));

    const startedAt = new Date();
    const durationMinutes = challenge.estimatedDurationMinutes;
    const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

    // Initial code snapshot is created from starter files
    const initialSnapshot: Record<string, string> = {};
    for (const file of challenge.starterFiles) {
      initialSnapshot[file.path] = file.content;
    }

    // 2. Persist in database via repository
    const session = await this.repository.createSession({
      userId,
      selectedTechnologies: input.technologies,
      difficulty: input.difficulty,
      durationMinutes,
      startedAt,
      expiresAt,
      currentCodeSnapshot: initialSnapshot,
      exercise: {
        title: challenge.title,
        description: challenge.description,
        technologies: challenge.technologies,
        difficulty: challenge.difficulty,
        hasLivePreview,
        estimatedDurationMinutes: durationMinutes,
        starterFiles: challenge.starterFiles,
        publicTests: challenge.publicTests,
        privateTests: challenge.privateTests,
        canonicalSolution: challenge.canonicalSolution,
      },
    });

    const selectedTech: string[] = Array.isArray(session.selectedTechnologies)
      ? session.selectedTechnologies
      : typeof session.selectedTechnologies === 'string'
        ? JSON.parse(session.selectedTechnologies)
        : [];

    return {
      sessionId: session.id,
      exerciseId: session.exerciseId,
      title: session.exercise.title,
      difficulty: session.difficulty,
      technologies: selectedTech,
      durationMinutes: session.durationMinutes,
      startedAt: session.startedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      sessionMode: session.sessionMode as 'STANDARD' | 'SPEED_DRILL',
      hasLivePreview: session.exercise.hasLivePreview,
    };
  }

  async getWorkspace(sessionId: string): Promise<AssessmentWorkspaceResponse> {
    const session = await this.repository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundError('AssessmentSession', sessionId);
    }

    const now = Date.now();
    const remainingSeconds = Math.max(0, Math.floor((session.expiresAt.getTime() - now) / 1000));

    // Prepare workspace files:
    const snapshot = (
      typeof session.currentCodeSnapshot === 'object' && session.currentCodeSnapshot !== null
        ? session.currentCodeSnapshot
        : typeof session.currentCodeSnapshot === 'string'
          ? JSON.parse(session.currentCodeSnapshot)
          : {}
    ) as Record<string, string>;

    const rawStarterFiles = (
      Array.isArray(session.exercise.starterFiles)
        ? session.exercise.starterFiles
        : typeof session.exercise.starterFiles === 'string'
          ? JSON.parse(session.exercise.starterFiles)
          : []
    ) as StarterFile[];

    const rawPublicTests = (
      Array.isArray(session.exercise.publicTests)
        ? session.exercise.publicTests
        : typeof session.exercise.publicTests === 'string'
          ? JSON.parse(session.exercise.publicTests)
          : []
    ) as TestFile[];

    const exerciseTech: string[] = Array.isArray(session.exercise.technologies)
      ? session.exercise.technologies
      : typeof session.exercise.technologies === 'string'
        ? JSON.parse(session.exercise.technologies)
        : [];

    const files: WorkspaceFile[] = [];

    // 1. Candidate editable/starter files
    for (const sf of rawStarterFiles) {
      files.push({
        path: sf.path,
        content: snapshot[sf.path] !== undefined ? snapshot[sf.path]! : sf.content,
        readOnly: sf.readOnly,
      });
    }

    // 2. Public tests (strictly locked as readOnly: true per FR-006)
    for (const pt of rawPublicTests) {
      files.push({
        path: pt.path,
        content: pt.content,
        readOnly: true,
      });
    }

    // NOTE: Private tests and canonical solution are STRICTLY EXCLUDED (FR-019 / SC-005)

    return {
      sessionId: session.id,
      title: session.exercise.title,
      description: session.exercise.description,
      technologies: exerciseTech,
      hasLivePreview: session.exercise.hasLivePreview,
      remainingSeconds,
      status: session.status,
      files,
    };
  }

  async saveSnapshot(
    sessionId: string,
    files: Record<string, string>,
  ): Promise<{ success: boolean; savedAt: string }> {
    const session = await this.repository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundError('AssessmentSession', sessionId);
    }

    if (session.status === 'SUBMITTED') {
      throw new SubmissionNotAllowedError('Cannot save snapshot on already submitted assessment.');
    }

    // Check expiration with 5-second grace period (FR-018 / SC-006)
    const gracePeriodMs = 5000;
    if (Date.now() > session.expiresAt.getTime() + gracePeriodMs) {
      await this.repository.updateStatus(sessionId, 'EXPIRED');
      throw new SessionExpiredError(sessionId);
    }

    await this.repository.updateSnapshot(sessionId, files);

    return {
      success: true,
      savedAt: new Date().toISOString(),
    };
  }
}
