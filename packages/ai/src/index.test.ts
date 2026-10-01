import { describe, it, expect } from 'vitest';
import {
  getAiModelProvider,
  AVAILABLE_MODELS,
  buildChallengePrompt,
  GeneratedChallengeSchema,
} from './index';

describe('AI Multi-Model Provider Architecture', () => {
  it('should list available models across Google, OpenAI, and Anthropic', () => {
    expect(AVAILABLE_MODELS.length).toBeGreaterThanOrEqual(6);
    expect(AVAILABLE_MODELS.some((m) => m.provider === 'Google')).toBe(true);
    expect(AVAILABLE_MODELS.some((m) => m.provider === 'OpenAI')).toBe(true);
    expect(AVAILABLE_MODELS.some((m) => m.provider === 'Anthropic')).toBe(true);
  });

  it('should instantiate appropriate provider based on model ID', () => {
    const gemini = getAiModelProvider('gemini-2.5-pro');
    expect(gemini.providerId).toBe('gemini');

    const openai = getAiModelProvider('gpt-4o');
    expect(openai.providerId).toBe('openai');

    const claude = getAiModelProvider('claude-3-7-sonnet');
    expect(claude.providerId).toBe('anthropic');
  });

  it('should build prompt with strict constraint requirements', () => {
    const prompt = buildChallengePrompt({
      technologies: ['React', 'TypeScript'],
      difficulty: 'Intermediate',
    });

    expect(prompt).toContain('Target Technologies: React, TypeScript');
    expect(prompt).toContain('Difficulty Level: Intermediate');
    expect(prompt).toContain(
      'Duration Budget: Calculate an accurate time budget strictly between 20 and 60 minutes',
    );
    expect(prompt).toContain('Live Preview: The challenge involves visual rendering');
  });

  it('should validate structured challenge schema correctly', () => {
    const mockChallenge = {
      title: 'Real-Time Notification Bell',
      description: 'Build an accessible notification bell component.',
      technologies: ['React', 'TypeScript'],
      difficulty: 'Intermediate',
      estimatedDurationMinutes: 35,
      starterFiles: [
        { path: 'src/App.tsx', content: 'export default function App() {}', readOnly: false },
        { path: 'package.json', content: '{}', readOnly: true },
      ],
      publicTests: [{ path: 'tests/public/render.test.tsx', content: 'test("renders", () => {})' }],
      privateTests: [
        { path: 'tests/private/edge.test.tsx', content: 'test("edge", () => {})' },
        { path: 'tests/private/perf.test.tsx', content: 'test("perf", () => {})' },
      ],
      canonicalSolution: [
        {
          path: 'src/App.tsx',
          content: 'export default function App() { return <div>Bell</div>; }',
        },
      ],
    };

    const parsed = GeneratedChallengeSchema.safeParse(mockChallenge);
    expect(parsed.success).toBe(true);
  });
});
