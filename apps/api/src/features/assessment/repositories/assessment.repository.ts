import { prisma, AssessmentSession, ExerciseDefinition, Prisma } from '@hackerearth/database';

export interface CreateAssessmentSessionRecord {
  userId: string;
  exercise: {
    title: string;
    description: string;
    technologies: string[];
    difficulty: string;
    architecturePattern?: string;
    hasLivePreview: boolean;
    estimatedDurationMinutes: number;
    starterFiles: unknown;
    publicTests: unknown;
    privateTests: unknown;
    canonicalSolution: unknown;
    validationStatus?: string;
  };
  durationMinutes: number;
  selectedTechnologies: string[];
  difficulty: string;
  sessionMode?: string;
  parentSessionId?: string;
  startedAt: Date;
  expiresAt: Date;
  currentCodeSnapshot: unknown;
}

export class AssessmentRepository {
  async createSession(
    data: CreateAssessmentSessionRecord,
  ): Promise<AssessmentSession & { exercise: ExerciseDefinition }> {
    const session = await prisma.assessmentSession.create({
      data: {
        userId: data.userId,
        selectedTechnologies: data.selectedTechnologies,
        difficulty: data.difficulty,
        durationMinutes: data.durationMinutes,
        sessionMode: data.sessionMode ?? 'STANDARD',
        startedAt: data.startedAt,
        expiresAt: data.expiresAt,
        status: 'ACTIVE',
        currentCodeSnapshot: data.currentCodeSnapshot as Prisma.InputJsonValue,
        ...(data.parentSessionId
          ? { parentSession: { connect: { id: data.parentSessionId } } }
          : {}),
        exercise: {
          create: {
            title: data.exercise.title,
            description: data.exercise.description,
            technologies: data.exercise.technologies,
            difficulty: data.exercise.difficulty,
            architecturePattern: data.exercise.architecturePattern ?? 'SINGLE_INTEGRATED_PROJECT',
            hasLivePreview: data.exercise.hasLivePreview,
            estimatedDurationMinutes: data.exercise.estimatedDurationMinutes,
            starterFiles: data.exercise.starterFiles as Prisma.InputJsonValue,
            publicTests: data.exercise.publicTests as Prisma.InputJsonValue,
            privateTests: data.exercise.privateTests as Prisma.InputJsonValue,
            canonicalSolution: data.exercise.canonicalSolution as Prisma.InputJsonValue,
            validationStatus: data.exercise.validationStatus ?? 'VERIFIED',
          },
        },
      },
      include: {
        exercise: true,
      },
    });

    return session;
  }

  async findSessionById(
    id: string,
  ): Promise<(AssessmentSession & { exercise: ExerciseDefinition }) | null> {
    return prisma.assessmentSession.findUnique({
      where: { id },
      include: { exercise: true },
    });
  }

  async updateSnapshot(id: string, snapshot: Record<string, string>): Promise<AssessmentSession> {
    return prisma.assessmentSession.update({
      where: { id },
      data: {
        currentCodeSnapshot: snapshot as Prisma.InputJsonValue,
      },
    });
  }

  async updateStatus(id: string, status: string, finalScore?: number): Promise<AssessmentSession> {
    return prisma.assessmentSession.update({
      where: { id },
      data: {
        status,
        ...(finalScore !== undefined ? { finalScore } : {}),
      },
    });
  }
}
