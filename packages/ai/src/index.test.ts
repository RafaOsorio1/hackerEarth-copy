import { describe, it, expect } from 'vitest';
import {
  getAiModelProvider,
  AVAILABLE_MODELS,
  buildChallengePrompt,
  GeneratedChallengeSchema,
  cleanJson,
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

  it('should enforce HTML/CSS-only constraints and tailor starter files in prompt when JS is not selected', () => {
    const prompt = buildChallengePrompt({
      technologies: ['HTML'],
      difficulty: 'Beginner',
    });

    expect(prompt).toContain('CRITICAL HTML/CSS-ONLY CONSTRAINT');
    expect(prompt).toContain('Candidate implementation files (in starterFiles and canonicalSolution) MUST NOT contain any .js');
    expect(prompt).toContain('index.html');
    expect(prompt).toContain('styles.css');
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

  it('should accept challenges with a single private test file and reject empty test arrays', () => {
    const singleTechChallenge = {
      title: 'Debounce Function Implementation',
      description: 'Implement a reusable debounce utility in pure JavaScript.',
      technologies: ['JavaScript'],
      difficulty: 'Beginner',
      estimatedDurationMinutes: 25,
      starterFiles: [
        { path: 'src/debounce.js', content: 'export function debounce(fn, ms) {}', readOnly: false },
        { path: 'package.json', content: '{"name": "debounce"}', readOnly: true },
      ],
      publicTests: [
        { path: 'tests/public/basic.test.js', content: 'test("calls once after delay", () => {})' },
      ],
      privateTests: [
        {
          path: 'tests/private/edge_cases.test.js',
          content: 'test("immediate execution, cancels, and arguments preservation", () => {})',
        },
      ],
      canonicalSolution: [
        {
          path: 'src/debounce.js',
          content: 'export function debounce(fn, ms) { return function() {}; }',
        },
      ],
    };

    const validResult = GeneratedChallengeSchema.safeParse(singleTechChallenge);
    expect(validResult.success).toBe(true);

    const zeroPrivateTestsChallenge = {
      ...singleTechChallenge,
      privateTests: [],
    };
    const invalidResult = GeneratedChallengeSchema.safeParse(zeroPrivateTestsChallenge);
    expect(invalidResult.success).toBe(false);
  });
});

describe('cleanJson robust JSON extractor', () => {
  it('should parse clean raw JSON objects without modification', () => {
    const raw = '{"title": "Clean JSON", "valid": true}';
    const cleaned = cleanJson(raw);
    expect(JSON.parse(cleaned)).toEqual({ title: 'Clean JSON', valid: true });
  });

  it('should extract JSON wrapped in markdown code blocks', () => {
    const raw = '```json\n{"title": "Markdown Wrapped", "num": 42}\n```';
    const cleaned = cleanJson(raw);
    expect(JSON.parse(cleaned)).toEqual({ title: 'Markdown Wrapped', num: 42 });
  });

  it('should safely discard trailing markdown commentary containing functions and braces', () => {
    const raw = `\`\`\`json
{"title": "Challenge Title", "files": [{"path": "index.js", "content": "hello"}]}
\`\`\`
Here is how to test it:
\`\`\`javascript
function helper() {
  const options = { timeout: 5000 };
  return true;
}
\`\`\``;
    const cleaned = cleanJson(raw);
    expect(() => JSON.parse(cleaned)).not.toThrow();
    const parsed = JSON.parse(cleaned);
    expect(parsed.title).toBe('Challenge Title');
  });

  it('should correctly handle braces and escaped quotes inside JSON string fields', () => {
    const raw = `{"title": "Complex Code", "code": "function run() { const obj = { a: \\"{\\" }; return obj; }"}
Extra notes: { note: "should be ignored" }`;
    const cleaned = cleanJson(raw);
    expect(() => JSON.parse(cleaned)).not.toThrow();
    const parsed = JSON.parse(cleaned);
    expect(parsed.title).toBe('Complex Code');
    expect(parsed.code).toContain('{ const obj = { a: "{" };');
  });

  it('should handle text before and after JSON object', () => {
    const raw = `Here is your assessment:
{"title": "Surrounded JSON", "score": 100}
Hope you enjoy it!`;
    const cleaned = cleanJson(raw);
    expect(JSON.parse(cleaned)).toEqual({ title: 'Surrounded JSON', score: 100 });
  });
});
