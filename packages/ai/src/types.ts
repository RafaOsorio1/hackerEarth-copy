import { z } from 'zod';

export const SupportedTechnologySchema = z.enum([
  'HTML',
  'CSS',
  'JavaScript',
  'TypeScript',
  'React',
  'NodeJS',
]);

export type SupportedTechnology = z.infer<typeof SupportedTechnologySchema>;

export const ChallengeDifficultySchema = z.enum(['Beginner', 'Intermediate', 'Advanced']);
export type ChallengeDifficulty = z.infer<typeof ChallengeDifficultySchema>;

export const StarterFileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  readOnly: z.boolean(),
});
export type StarterFile = z.infer<typeof StarterFileSchema>;

export const TestFileSchema = z.object({
  path: z.string().min(1),
  content: z.string().min(1),
});
export type TestFile = z.infer<typeof TestFileSchema>;

export const CanonicalSolutionFileSchema = z.object({
  path: z.string().min(1),
  content: z.string().min(1),
});
export type CanonicalSolutionFile = z.infer<typeof CanonicalSolutionFileSchema>;

export const GeneratedChallengeSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  technologies: z.array(z.string()).min(1),
  difficulty: ChallengeDifficultySchema,
  estimatedDurationMinutes: z.number().int().min(20).max(60),
  starterFiles: z.array(StarterFileSchema).min(2),
  publicTests: z.array(TestFileSchema).min(1),
  privateTests: z.array(TestFileSchema).min(2),
  canonicalSolution: z.array(CanonicalSolutionFileSchema).min(1),
});

export type GeneratedChallenge = z.infer<typeof GeneratedChallengeSchema>;

export interface GenerateChallengeParams {
  technologies: SupportedTechnology[];
  difficulty: ChallengeDifficulty;
  focusArea?: string;
  targetDurationMinutes?: number;
  reactDialect?: 'JavaScript' | 'TypeScript';
}

export interface FeedbackGenerationParams {
  challengeTitle: string;
  technologies: string[];
  submittedCode: Record<string, string>;
  testResults: {
    passed: number;
    total: number;
    failures: Array<{ testName: string; errorMessage?: string; diff?: string }>;
  };
  durationMinutes: number;
  timeSpentMinutes: number;
}

export interface IAiModelProvider {
  readonly providerId: string;
  readonly modelName: string;
  generateChallenge(params: GenerateChallengeParams): Promise<GeneratedChallenge>;
  generateFeedback(params: FeedbackGenerationParams): Promise<string>;
}
