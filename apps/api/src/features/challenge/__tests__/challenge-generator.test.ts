import { describe, it, expect, vi } from 'vitest';
import { ChallengeGeneratorService } from '../services/challenge-generator.service';
import { PreValidationService } from '../services/pre-validation.service';
import { IAiModelProvider, GeneratedChallenge } from '@hackerearth/ai';

describe('ChallengeGeneratorService', () => {
  const mockGeneratedChallenge: GeneratedChallenge = {
    title: 'Real-Time Notification Banner',
    description: 'Build a notification component that dismisses automatically after 5 seconds.',
    technologies: ['React', 'TypeScript'],
    difficulty: 'Intermediate',
    estimatedDurationMinutes: 30,
    starterFiles: [
      { path: 'src/Banner.tsx', content: 'export function Banner() {}', readOnly: false },
      { path: 'package.json', content: '{"name": "banner"}', readOnly: true },
    ],
    publicTests: [{ path: 'tests/public/render.test.tsx', content: 'test("renders", () => {})' }],
    privateTests: [
      { path: 'tests/private/dismiss.test.tsx', content: 'test("auto dismiss", () => {})' },
      { path: 'tests/private/edge.test.tsx', content: 'test("multiple banners", () => {})' },
    ],
    canonicalSolution: [
      {
        path: 'src/Banner.tsx',
        content: 'export function Banner() { return <div>Notification</div>; }',
      },
    ],
  };

  it('should generate a challenge strictly bounded between 20 and 60 minutes', async () => {
    const mockProvider: IAiModelProvider = {
      providerId: 'mock-gemini',
      modelName: 'gemini-2.5-pro',
      generateChallenge: vi.fn().mockResolvedValue(mockGeneratedChallenge),
      generateFeedback: vi.fn(),
    };

    const service = new ChallengeGeneratorService();
    const challenge = await service.generate(
      {
        technologies: ['React', 'TypeScript'],
        difficulty: 'Intermediate',
        reactDialect: 'TypeScript',
      },
      mockProvider,
    );

    expect(challenge.title).toBe('Real-Time Notification Banner');
    expect(challenge.estimatedDurationMinutes).toBeGreaterThanOrEqual(20);
    expect(challenge.estimatedDurationMinutes).toBeLessThanOrEqual(60);
    expect(challenge.technologies).toEqual(['React', 'TypeScript']);
  });

  it('should clamp duration between 20 and 60 if AI returns out of bounds', async () => {
    const outOfBoundsChallenge: GeneratedChallenge = {
      ...mockGeneratedChallenge,
      estimatedDurationMinutes: 75,
    };

    const mockProvider: IAiModelProvider = {
      providerId: 'mock-gemini',
      modelName: 'gemini-2.5-pro',
      generateChallenge: vi.fn().mockResolvedValue(outOfBoundsChallenge),
      generateFeedback: vi.fn(),
    };

    const service = new ChallengeGeneratorService();
    const challenge = await service.generate(
      {
        technologies: ['React', 'TypeScript'],
        difficulty: 'Intermediate',
        reactDialect: 'TypeScript',
      },
      mockProvider,
    );

    expect(challenge.estimatedDurationMinutes).toBe(60);
  });

  it('should pass cleanly when pre-validation succeeds on the first attempt', async () => {
    const mockPreValidator = {
      validate: vi.fn().mockResolvedValue({ isValid: true, errors: [] }),
    };

    const mockProvider: IAiModelProvider = {
      providerId: 'mock-gemini',
      modelName: 'gemini-3-flash-preview',
      generateChallenge: vi.fn().mockResolvedValue(mockGeneratedChallenge),
      generateFeedback: vi.fn(),
    };

    const service = new ChallengeGeneratorService(
      mockPreValidator as unknown as PreValidationService,
    );
    const challenge = await service.generate(
      {
        technologies: ['React', 'TypeScript'],
        difficulty: 'Intermediate',
        reactDialect: 'TypeScript',
      },
      mockProvider,
    );

    expect(challenge.title).toBe('Real-Time Notification Banner');
    expect(mockPreValidator.validate).toHaveBeenCalledTimes(1);
    expect(mockProvider.generateChallenge).toHaveBeenCalledTimes(1);
  });

  it('should automatically retry once when pre-validation fails, and succeed if second attempt passes', async () => {
    const mockPreValidator = {
      validate: vi
        .fn()
        .mockResolvedValueOnce({ isValid: false, errors: ['Flawed canonical solution'] })
        .mockResolvedValueOnce({ isValid: true, errors: [] }),
    };

    const mockProvider: IAiModelProvider = {
      providerId: 'mock-gemini',
      modelName: 'gemini-3-flash-preview',
      generateChallenge: vi.fn().mockResolvedValue(mockGeneratedChallenge),
      generateFeedback: vi.fn(),
    };

    const service = new ChallengeGeneratorService(
      mockPreValidator as unknown as PreValidationService,
    );
    const challenge = await service.generate(
      {
        technologies: ['React', 'TypeScript'],
        difficulty: 'Intermediate',
        reactDialect: 'TypeScript',
      },
      mockProvider,
    );

    expect(challenge.title).toBe('Real-Time Notification Banner');
    expect(mockPreValidator.validate).toHaveBeenCalledTimes(2);
    expect(mockProvider.generateChallenge).toHaveBeenCalledTimes(2);
  });

  it('should throw ChallengeGenerationError if pre-validation fails after retry', async () => {
    const mockPreValidator = {
      validate: vi
        .fn()
        .mockResolvedValue({ isValid: false, errors: ['Persistent canonical solution flaw'] }),
    };

    const mockProvider: IAiModelProvider = {
      providerId: 'mock-gemini',
      modelName: 'gemini-3-flash-preview',
      generateChallenge: vi.fn().mockResolvedValue(mockGeneratedChallenge),
      generateFeedback: vi.fn(),
    };

    const service = new ChallengeGeneratorService(
      mockPreValidator as unknown as PreValidationService,
    );

    await expect(
      service.generate(
        {
          technologies: ['React', 'TypeScript'],
          difficulty: 'Intermediate',
          reactDialect: 'TypeScript',
        },
        mockProvider,
      ),
    ).rejects.toThrow(/Pre-validation failed after retry/);

    expect(mockPreValidator.validate).toHaveBeenCalledTimes(2);
    expect(mockProvider.generateChallenge).toHaveBeenCalledTimes(2);
  });
});
