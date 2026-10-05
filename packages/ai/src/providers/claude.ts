import Anthropic from '@anthropic-ai/sdk';
import { cleanJson } from './gemini';
import {
  GenerateChallengeParams,
  FeedbackGenerationParams,
  GeneratedChallenge,
  GeneratedChallengeSchema,
  IAiModelProvider,
} from '../types';
import { buildChallengePrompt, buildFeedbackPrompt } from '../prompts/challengePrompt';

export class ClaudeProvider implements IAiModelProvider {
  readonly providerId = 'anthropic';
  readonly modelName: string;
  private client: Anthropic;

  constructor(modelName: string = 'claude-3-7-sonnet-20250219', apiKey?: string) {
    this.modelName = modelName;
    const key = apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.client = new Anthropic({ apiKey: key });
  }

  async generateChallenge(params: GenerateChallengeParams): Promise<GeneratedChallenge> {
    const prompt = buildChallengePrompt(params);

    const response = await this.client.messages.create({
      model: this.modelName,
      max_tokens: 8192,
      system:
        'You are an expert technical assessment creator. Respond strictly with raw valid JSON without markdown wrapping or commentary.',
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content[0];
    if (!block || block.type !== 'text') {
      throw new Error(`Anthropic returned invalid block structure for model ${this.modelName}`);
    }

    const parsed = JSON.parse(cleanJson(block.text));
    return GeneratedChallengeSchema.parse(parsed);
  }

  async generateFeedback(params: FeedbackGenerationParams): Promise<string> {
    const prompt = buildFeedbackPrompt(params);

    const response = await this.client.messages.create({
      model: this.modelName,
      max_tokens: 4096,
      system:
        'You are an expert technical interviewer providing speed and technical agility feedback.',
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content[0];
    if (!block || block.type !== 'text') {
      return 'Unable to generate feedback at this time.';
    }

    return block.text;
  }
}
