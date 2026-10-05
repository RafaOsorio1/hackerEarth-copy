import {
  GeneratedChallenge,
  IAiModelProvider,
  getAiModelProvider,
  SupportedTechnology,
  ChallengeDifficulty,
} from '@hackerearth/ai';
import { ChallengeGenerationError } from '../../../shared/errors/domain-errors';
import { PreValidationService } from './pre-validation.service';

export interface GenerateChallengeInput {
  technologies: SupportedTechnology[];
  difficulty: ChallengeDifficulty;
  reactDialect?: 'JavaScript' | 'TypeScript';
  modelId?: string;
}

export class ChallengeGeneratorService {
  constructor(private readonly preValidator?: PreValidationService) {}

  async generate(
    input: GenerateChallengeInput,
    overrideProvider?: IAiModelProvider,
  ): Promise<GeneratedChallenge> {
    const provider = overrideProvider ?? getAiModelProvider(input.modelId);

    const generateSingle = async (): Promise<GeneratedChallenge> => {
      const challenge = await provider.generateChallenge({
        technologies: input.technologies,
        difficulty: input.difficulty,
        reactDialect: input.reactDialect,
      });

      // Strict interview constraint: Bounded between 20 and 60 minutes
      const boundedDuration = Math.min(60, Math.max(20, challenge.estimatedDurationMinutes));

      return {
        ...challenge,
        estimatedDurationMinutes: boundedDuration,
      };
    };

    try {
      let challenge: GeneratedChallenge;
      try {
        challenge = await generateSingle();
      } catch (firstErr) {
        console.warn(
          `[ChallengeGenerator] Initial generation failed (${firstErr instanceof Error ? firstErr.message : String(firstErr)}). Attempting single retry...`,
        );
        challenge = await generateSingle();
      }

      if (this.preValidator) {
        let validation = await this.preValidator.validate(challenge, {
          technologies: input.technologies,
          difficulty: input.difficulty,
          reactDialect: input.reactDialect,
        });

        if (!validation.isValid) {
          console.warn(
            `[ChallengeGenerator] Pre-validation failed (${validation.errors.join('; ')}). Attempting single retry...`,
          );
          challenge = await generateSingle();
          validation = await this.preValidator.validate(challenge, {
            technologies: input.technologies,
            difficulty: input.difficulty,
            reactDialect: input.reactDialect,
          });

          if (!validation.isValid) {
            throw new ChallengeGenerationError(
              `Pre-validation failed after retry: ${validation.errors.join('; ')}`,
            );
          }
        }
      }

      return challenge;
    } catch (err) {
      if (err instanceof ChallengeGenerationError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : 'Unknown generation failure';
      throw new ChallengeGenerationError(message, err);
    }
  }
}
