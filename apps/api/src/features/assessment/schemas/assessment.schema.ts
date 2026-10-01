import { z } from 'zod';
import { SupportedTechnologySchema, ChallengeDifficultySchema } from '@hackerearth/ai';

export const ReactDialectSchema = z.enum(['JavaScript', 'TypeScript']);
export type ReactDialect = z.infer<typeof ReactDialectSchema>;

export const CreateAssessmentRequestSchema = z
  .object({
    technologies: z.array(SupportedTechnologySchema).min(1),
    reactDialect: ReactDialectSchema.optional(),
    difficulty: ChallengeDifficultySchema,
    modelId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.technologies.includes('React')) {
        return !!data.reactDialect;
      }
      return true;
    },
    {
      message: "reactDialect ('JavaScript' | 'TypeScript') is required when React is selected.",
      path: ['reactDialect'],
    },
  );

export type CreateAssessmentRequest = z.infer<typeof CreateAssessmentRequestSchema>;

export const AssessmentSessionResponseSchema = z.object({
  sessionId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  title: z.string(),
  difficulty: z.string(),
  technologies: z.array(z.string()),
  durationMinutes: z.number().int().min(20).max(60),
  startedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  sessionMode: z.enum(['STANDARD', 'SPEED_DRILL']),
  hasLivePreview: z.boolean(),
});

export type AssessmentSessionResponse = z.infer<typeof AssessmentSessionResponseSchema>;

export const WorkspaceFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  readOnly: z.boolean(),
});
export type WorkspaceFile = z.infer<typeof WorkspaceFileSchema>;

export const AssessmentWorkspaceResponseSchema = z.object({
  sessionId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
  hasLivePreview: z.boolean(),
  remainingSeconds: z.number().int(),
  status: z.string(),
  files: z.array(WorkspaceFileSchema),
});

export type AssessmentWorkspaceResponse = z.infer<typeof AssessmentWorkspaceResponseSchema>;

export const SessionParamsSchema = z.object({
  id: z.string().min(1, 'Session ID is required'),
});
export type SessionParams = z.infer<typeof SessionParamsSchema>;

export const SaveSnapshotRequestSchema = z.object({
  files: z.record(z.string()),
});
export type SaveSnapshotRequest = z.infer<typeof SaveSnapshotRequestSchema>;

export const SubmitAssessmentRequestSchema = z.object({
  trigger: z.enum(['MANUAL', 'AUTO_TIMEOUT']),
  files: z.record(z.string()),
});
export type SubmitAssessmentRequest = z.infer<typeof SubmitAssessmentRequestSchema>;

export const TestOutputSchema = z.object({
  testName: z.string(),
  status: z.enum(['PASSED', 'FAILED']),
  errorMessage: z.string().optional(),
  diff: z.string().optional(),
  durationMs: z.number(),
});
export type TestOutput = z.infer<typeof TestOutputSchema>;

export const EvaluationResultResponseSchema = z.object({
  numericScore: z.number().min(0).max(100),
  passedPrivateTests: z.number().int(),
  totalPrivateTests: z.number().int(),
  testOutputs: z.array(TestOutputSchema),
  aiFeedbackSummary: z.string(),
});
export type EvaluationResultResponse = z.infer<typeof EvaluationResultResponseSchema>;

export const SubmissionResponseSchema = z.object({
  submissionId: z.string().uuid(),
  status: z.enum(['EVALUATING', 'EVALUATED']),
});
export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;
