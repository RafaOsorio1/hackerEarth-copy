import { AssessmentRepository } from '../../assessment/repositories/assessment.repository';
import { EvaluationRepository } from '../repositories/evaluation.repository';
import { SandboxRunnerService } from './sandbox-runner.service';
import {
  SubmissionResponse,
  EvaluationResultResponse,
  TestOutput,
} from '../../assessment/schemas/assessment.schema';
import {
  NotFoundError,
  SessionExpiredError,
  SubmissionNotAllowedError,
  AssessmentNotEvaluatedError,
} from '../../../shared/errors/domain-errors';
import { IAiModelProvider, createAiProvider, TestFile, StarterFile } from '@hackerearth/ai';
import { prisma } from '@hackerearth/database';

export class EvaluationService {
  private readonly aiProvider: IAiModelProvider;

  constructor(
    private readonly assessmentRepo: AssessmentRepository,
    private readonly evaluationRepo: EvaluationRepository,
    private readonly sandboxRunner: SandboxRunnerService,
    aiProviderOverride?: IAiModelProvider,
  ) {
    this.aiProvider = aiProviderOverride ?? createAiProvider('gemini-3-flash-preview');
  }

  async submitAssessment(
    sessionId: string,
    trigger: 'MANUAL' | 'AUTO_TIMEOUT',
    files: Record<string, string>,
  ): Promise<SubmissionResponse> {
    const session = await this.assessmentRepo.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundError('AssessmentSession', sessionId);
    }

    if (session.status === 'SUBMITTED' || session.status === 'EVALUATED') {
      throw new SubmissionNotAllowedError('Assessment session has already been submitted.');
    }

    // Authoritative deadline check with 5-second grace period (SC-006 / FR-013)
    const gracePeriodMs = 5000;
    if (Date.now() > session.expiresAt.getTime() + gracePeriodMs) {
      await this.assessmentRepo.updateStatus(sessionId, 'EXPIRED');
      throw new SessionExpiredError(sessionId);
    }

    // 1. Create submission record
    const submission = await this.evaluationRepo.createSubmission({
      sessionId,
      trigger,
      submittedCode: files,
      submittedAt: new Date(),
    });

    // 2. Transition status to EVALUATING
    await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        status: 'EVALUATING',
        submittedAt: new Date(),
        currentCodeSnapshot: files,
      },
    });

    // 3. Prepare files for private test evaluation
    const rawStarterFiles = (
      Array.isArray(session.exercise.starterFiles)
        ? session.exercise.starterFiles
        : typeof session.exercise.starterFiles === 'string'
          ? JSON.parse(session.exercise.starterFiles)
          : []
    ) as StarterFile[];

    const rawPrivateTests = (
      Array.isArray(session.exercise.privateTests)
        ? session.exercise.privateTests
        : typeof session.exercise.privateTests === 'string'
          ? JSON.parse(session.exercise.privateTests)
          : []
    ) as TestFile[];

    // Merge non-editable starter files (like configs) with submitted code
    const executionFiles: Record<string, string> = {};
    for (const sf of rawStarterFiles) {
      executionFiles[sf.path] = sf.content;
    }
    for (const [p, c] of Object.entries(files)) {
      executionFiles[p] = c;
    }

    // 4. Run private tests in sandbox
    const runResult = await this.sandboxRunner.runTests({
      files: executionFiles,
      testFiles: rawPrivateTests,
    });

    // 5. Generate AI formative review
    const timeSpentMinutes = Math.max(
      1,
      Math.round((Date.now() - session.startedAt.getTime()) / 60000),
    );

    const exerciseTech: string[] = Array.isArray(session.exercise.technologies)
      ? session.exercise.technologies
      : typeof session.exercise.technologies === 'string'
        ? JSON.parse(session.exercise.technologies)
        : [];

    let aiFeedback = 'Challenge completed under interview pressure. Private tests evaluated.';
    try {
      aiFeedback = await this.aiProvider.generateFeedback({
        challengeTitle: session.exercise.title,
        technologies: exerciseTech,
        submittedCode: files,
        testResults: {
          passed: runResult.passedPrivateTests,
          total: runResult.totalPrivateTests,
          failures: runResult.testOutputs
            .filter((t) => t.status === 'FAILED')
            .map((t) => ({
              testName: t.testName,
              errorMessage: t.errorMessage,
              diff: t.diff,
            })),
        },
        durationMinutes: session.durationMinutes,
        timeSpentMinutes,
      });
    } catch (err) {
      console.error('Failed to generate AI feedback:', err);
    }

    // 6. Persist evaluation result
    await this.evaluationRepo.createEvaluationResult({
      submissionId: submission.id,
      numericScore: runResult.numericScore,
      passedPrivateTests: runResult.passedPrivateTests,
      totalPrivateTests: runResult.totalPrivateTests,
      detailedTestOutputs: runResult.testOutputs,
      aiFeedbackSummary: aiFeedback,
    });

    // 7. Transition session status to EVALUATED with final score
    await this.assessmentRepo.updateStatus(sessionId, 'EVALUATED', runResult.numericScore);

    return {
      submissionId: submission.id,
      status: 'EVALUATING',
    };
  }

  async getEvaluationResult(sessionId: string): Promise<EvaluationResultResponse> {
    const session = await this.assessmentRepo.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundError('AssessmentSession', sessionId);
    }

    const result = await this.evaluationRepo.findEvaluationResultBySessionId(sessionId);
    if (!result) {
      throw new AssessmentNotEvaluatedError(sessionId);
    }

    const testOutputs = (
      Array.isArray(result.detailedTestOutputs)
        ? result.detailedTestOutputs
        : typeof result.detailedTestOutputs === 'string'
          ? JSON.parse(result.detailedTestOutputs)
          : []
    ) as TestOutput[];

    return {
      numericScore: result.numericScore,
      passedPrivateTests: result.passedPrivateTests,
      totalPrivateTests: result.totalPrivateTests,
      testOutputs,
      aiFeedbackSummary: result.aiFeedbackSummary,
    };
  }
}
