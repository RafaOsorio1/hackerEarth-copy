import { prisma, Submission, EvaluationResult, Prisma } from '@hackerearth/database';
import { TestOutput } from '../../assessment/schemas/assessment.schema';

export interface CreateSubmissionRecord {
  sessionId: string;
  trigger: 'MANUAL' | 'AUTO_TIMEOUT';
  submittedCode: Record<string, string>;
  submittedAt?: Date;
}

export interface CreateEvaluationResultRecord {
  submissionId: string;
  numericScore: number;
  passedPrivateTests: number;
  totalPrivateTests: number;
  detailedTestOutputs: TestOutput[];
  aiFeedbackSummary: string;
}

export class EvaluationRepository {
  async createSubmission(data: CreateSubmissionRecord): Promise<Submission> {
    return prisma.submission.create({
      data: {
        sessionId: data.sessionId,
        trigger: data.trigger,
        submittedCode: data.submittedCode as Prisma.InputJsonValue,
        submittedAt: data.submittedAt ?? new Date(),
      },
    });
  }

  async findSubmissionById(id: string): Promise<Submission | null> {
    return prisma.submission.findUnique({
      where: { id },
    });
  }

  async findLatestSubmissionBySessionId(
    sessionId: string,
  ): Promise<(Submission & { evaluationResult: EvaluationResult | null }) | null> {
    return prisma.submission.findFirst({
      where: { sessionId },
      orderBy: { submittedAt: 'desc' },
      include: { evaluationResult: true },
    });
  }

  async createEvaluationResult(data: CreateEvaluationResultRecord): Promise<EvaluationResult> {
    return prisma.evaluationResult.create({
      data: {
        submissionId: data.submissionId,
        numericScore: data.numericScore,
        passedPrivateTests: data.passedPrivateTests,
        totalPrivateTests: data.totalPrivateTests,
        detailedTestOutputs: data.detailedTestOutputs as unknown as Prisma.InputJsonValue,
        aiFeedbackSummary: data.aiFeedbackSummary,
      },
    });
  }

  async findEvaluationResultBySessionId(sessionId: string): Promise<EvaluationResult | null> {
    const submission = await this.findLatestSubmissionBySessionId(sessionId);
    return submission?.evaluationResult ?? null;
  }
}
