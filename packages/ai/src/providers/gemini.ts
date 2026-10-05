import { GoogleGenAI } from '@google/genai';
import {
  GenerateChallengeParams,
  FeedbackGenerationParams,
  GeneratedChallenge,
  GeneratedChallengeSchema,
  IAiModelProvider,
} from '../types';
import { buildChallengePrompt, buildFeedbackPrompt } from '../prompts/challengePrompt';

export function cleanJson(raw: string): string {
  let cleaned = raw.trim();

  // If wrapped in a markdown code block (```json ... ``` or ``` ... ```), extract its contents
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const textToScan = codeBlockMatch && codeBlockMatch[1] ? codeBlockMatch[1] : cleaned;

  const firstBrace = textToScan.indexOf('{');
  if (firstBrace === -1) {
    return textToScan.trim();
  }

  let depth = 0;
  let inString = false;
  let escape = false;
  let endBrace = -1;

  for (let i = firstBrace; i < textToScan.length; i++) {
    const char = textToScan[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          endBrace = i;
          break;
        }
      }
    }
  }

  if (endBrace !== -1) {
    return textToScan.substring(firstBrace, endBrace + 1).trim();
  }

  const lastBrace = textToScan.lastIndexOf('}');
  if (lastBrace !== -1 && lastBrace > firstBrace) {
    return textToScan.substring(firstBrace, lastBrace + 1).trim();
  }

  return textToScan.trim();
}

function normalizeChallenge(data: Record<string, unknown>): unknown {
  if (data.privateTests && !Array.isArray(data.privateTests) && typeof data.privateTests === 'object') {
    data.privateTests = [data.privateTests];
  }
  if (data.publicTests && !Array.isArray(data.publicTests) && typeof data.publicTests === 'object') {
    data.publicTests = [data.publicTests];
  }
  if (data.starterFiles && !Array.isArray(data.starterFiles) && typeof data.starterFiles === 'object') {
    data.starterFiles = [data.starterFiles];
  }
  if (data.canonicalSolution && !Array.isArray(data.canonicalSolution) && typeof data.canonicalSolution === 'object') {
    data.canonicalSolution = [data.canonicalSolution];
  }

  if (data.challenge_metadata && !data.title) {
    const meta = data.challenge_metadata as Record<string, unknown>;
    const instructions = (data.instructions || {}) as Record<string, unknown>;
    const rawStarterFiles = (data.starter_files || []) as Array<Record<string, unknown>>;
    const rawPublicTests = (data.public_tests || []) as Array<Record<string, unknown>>;
    const rawPrivateTests = (data.private_tests || []) as Array<Record<string, unknown>>;
    const rawCanonical = data.canonical_solution;

    return {
      title: meta.title || 'Technical Assessment Challenge',
      description:
        (typeof instructions.scenario === 'string' ? instructions.scenario : '') ||
        (typeof meta.objective === 'string' ? meta.objective : 'Complete the technical challenge.'),
      technologies: meta.technologies || ['HTML', 'CSS'],
      difficulty: meta.difficulty || 'Beginner',
      estimatedDurationMinutes: meta.duration_minutes || 30,
      starterFiles: rawStarterFiles.map((f, i) => ({
        path: (f.path || f.filename || `src/file_${i + 1}`) as string,
        content: (f.content || '') as string,
        readOnly: false,
      })),
      publicTests: rawPublicTests.map((t, idx) => ({
        path: (t.path || `tests/public/test_${idx + 1}.js`) as string,
        content: (t.content ||
          `test('${t.name || 'public assertion'}', () => { ${t.assertion || 'expect(true).toBe(true)'} });`) as string,
      })),
      privateTests: rawPrivateTests.map((t, idx) => ({
        path: (t.path || `tests/private/edge_${idx + 1}.js`) as string,
        content: (t.content ||
          `test('${t.name || 'private assertion'}', () => { ${t.assertion || 'expect(true).toBe(true)'} });`) as string,
      })),
      canonicalSolution: Array.isArray(rawCanonical)
        ? rawCanonical
        : Object.entries((rawCanonical as Record<string, unknown>) || {}).map(([p, c]) => ({
            path: p,
            content: String(c),
          })),
    };
  }
  return data;
}

export class GeminiProvider implements IAiModelProvider {
  readonly providerId = 'gemini';
  readonly modelName: string;
  private client: GoogleGenAI;

  constructor(modelName: string = 'gemini-3-flash-preview', apiKey?: string) {
    let resolvedModel = modelName;
    if (
      modelName === 'gemini-2.5-pro' ||
      modelName === 'gemini-2.5-flash' ||
      modelName === 'gemini-1.5-pro'
    ) {
      resolvedModel = 'gemini-3-flash-preview';
    }
    this.modelName = resolvedModel;
    const key = apiKey || process.env.GEMINI_API_KEY || '';
    this.client = new GoogleGenAI({ apiKey: key });
  }

  async generateChallenge(params: GenerateChallengeParams): Promise<GeneratedChallenge> {
    const prompt = buildChallengePrompt(params);

    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error(`Gemini returned empty response for model ${this.modelName}`);
      }

      const parsedJson = JSON.parse(cleanJson(text));
      const normalized = normalizeChallenge(parsedJson);
      return GeneratedChallengeSchema.parse(normalized);
    } catch (err: unknown) {
      if (this.modelName !== 'gemini-3-flash-preview') {
        const fallbackResponse = await this.client.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        const fallbackText = fallbackResponse.text;
        if (fallbackText) {
          const parsed = JSON.parse(cleanJson(fallbackText));
          const normalized = normalizeChallenge(parsed);
          return GeneratedChallengeSchema.parse(normalized);
        }
      }
      throw err;
    }
  }

  async generateFeedback(params: FeedbackGenerationParams): Promise<string> {
    const prompt = buildFeedbackPrompt(params);

    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      return response.text || 'Unable to generate feedback at this time.';
    } catch (err: unknown) {
      if (this.modelName !== 'gemini-3-flash-preview') {
        const fallbackResponse = await this.client.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        return fallbackResponse.text || 'Unable to generate feedback at this time.';
      }
      throw err;
    }
  }
}
