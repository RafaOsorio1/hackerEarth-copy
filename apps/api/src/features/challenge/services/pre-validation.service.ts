import { GeneratedChallenge, SupportedTechnology, ChallengeDifficulty } from '@hackerearth/ai';
import { TechnologyLeakDetector } from './technology-leak-detector.service';
import { SandboxRunnerService } from '../../evaluation/services/sandbox-runner.service';

export interface PreValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PreValidationInput {
  technologies: SupportedTechnology[];
  difficulty: ChallengeDifficulty;
  reactDialect?: 'JavaScript' | 'TypeScript';
}

export class PreValidationService {
  constructor(
    private readonly leakDetector: TechnologyLeakDetector,
    private readonly sandboxRunner: SandboxRunnerService,
  ) {}

  async validate(
    challenge: GeneratedChallenge,
    input: PreValidationInput,
  ): Promise<PreValidationResult> {
    const errors: string[] = [];

    // 1. Gather all files across manifests
    const allFiles = [
      ...challenge.starterFiles.map((f) => ({ path: f.path, content: f.content })),
      ...challenge.publicTests.map((t) => ({ path: t.path, content: t.content })),
      ...challenge.privateTests.map((t) => ({ path: t.path, content: t.content })),
      ...challenge.canonicalSolution.map((s) => ({ path: s.path, content: s.content })),
    ];

    // 2. Gate 1: Check for technology leaks
    const leakResult = this.leakDetector.detectLeaks(
      input.technologies,
      input.reactDialect,
      allFiles,
    );

    if (leakResult.hasLeak) {
      return {
        isValid: false,
        errors: leakResult.violations,
      };
    }

    // 3. Gate 2: Pre-validate that canonical solution passes all tests
    // Prepare canonical code files (starter configs + canonical implementation)
    const canonicalFiles: Record<string, string> = {};
    for (const sf of challenge.starterFiles) {
      canonicalFiles[sf.path] = sf.content;
    }
    for (const cs of challenge.canonicalSolution) {
      canonicalFiles[cs.path] = cs.content;
    }

    const allTestSuites = [...challenge.publicTests, ...challenge.privateTests];

    try {
      const runResult = await this.sandboxRunner.runTests({
        files: canonicalFiles,
        testFiles: allTestSuites,
      });

      if (runResult.passedPrivateTests < runResult.totalPrivateTests) {
        const failureDetails = runResult.testOutputs
          .filter((t) => t.status === 'FAILED')
          .map((t) => `${t.testName}: ${t.errorMessage || 'assertion failure'}`)
          .join('; ');

        errors.push(`Canonical solution failed verification tests: ${failureDetails}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown sandbox failure';
      errors.push(`Sandbox pre-validation execution failed: ${msg}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
