import { AssessmentRepository } from '../repositories/assessment.repository';
import { AssessmentSessionResponse } from '../schemas/assessment.schema';
import { NotFoundError } from '../../../shared/errors/domain-errors';
import { StarterFile } from '@hackerearth/ai';

export class SpeedDrillService {
  constructor(private readonly repository: AssessmentRepository) {}

  async createSpeedDrill(parentSessionId: string): Promise<AssessmentSessionResponse> {
    const parentSession = await this.repository.findSessionById(parentSessionId);
    if (!parentSession) {
      throw new NotFoundError('AssessmentSession', parentSessionId);
    }

    const durationMinutes = parentSession.durationMinutes;
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

    // Extract clean starter files from exercise definition (resetting any dirty edits)
    const rawStarterFiles = (
      Array.isArray(parentSession.exercise.starterFiles)
        ? parentSession.exercise.starterFiles
        : typeof parentSession.exercise.starterFiles === 'string'
          ? JSON.parse(parentSession.exercise.starterFiles)
          : []
    ) as StarterFile[];

    const initialSnapshot: Record<string, string> = {};
    for (const sf of rawStarterFiles) {
      initialSnapshot[sf.path] = sf.content;
    }

    const selectedTech: string[] = Array.isArray(parentSession.selectedTechnologies)
      ? parentSession.selectedTechnologies
      : typeof parentSession.selectedTechnologies === 'string'
        ? JSON.parse(parentSession.selectedTechnologies)
        : [];

    const exerciseTech: string[] = Array.isArray(parentSession.exercise.technologies)
      ? parentSession.exercise.technologies
      : typeof parentSession.exercise.technologies === 'string'
        ? JSON.parse(parentSession.exercise.technologies)
        : [];

    const session = await this.repository.createSession({
      userId: parentSession.userId,
      exercise: {
        title: parentSession.exercise.title,
        description: parentSession.exercise.description,
        technologies: exerciseTech,
        difficulty: parentSession.exercise.difficulty,
        architecturePattern: parentSession.exercise.architecturePattern,
        hasLivePreview: parentSession.exercise.hasLivePreview,
        estimatedDurationMinutes: durationMinutes,
        starterFiles: parentSession.exercise.starterFiles,
        publicTests: parentSession.exercise.publicTests,
        privateTests: parentSession.exercise.privateTests,
        canonicalSolution: parentSession.exercise.canonicalSolution,
        validationStatus: parentSession.exercise.validationStatus,
      },
      durationMinutes,
      selectedTechnologies: selectedTech,
      difficulty: parentSession.difficulty,
      sessionMode: 'SPEED_DRILL',
      parentSessionId,
      startedAt,
      expiresAt,
      currentCodeSnapshot: initialSnapshot,
    });

    return {
      sessionId: session.id,
      exerciseId: session.exerciseId,
      title: session.exercise.title,
      difficulty: session.difficulty,
      technologies: selectedTech,
      durationMinutes: session.durationMinutes,
      startedAt: session.startedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      sessionMode: 'SPEED_DRILL',
      hasLivePreview: session.exercise.hasLivePreview,
    };
  }
}
