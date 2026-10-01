import OpenAI from 'openai';
import {
  GenerateChallengeParams,
  FeedbackGenerationParams,
  GeneratedChallenge,
  GeneratedChallengeSchema,
  IAiModelProvider,
} from '../types';
import { buildChallengePrompt, buildFeedbackPrompt } from '../prompts/challengePrompt';

export class OpenAiProvider implements IAiModelProvider {
  readonly providerId = 'openai';
  readonly modelName: string;
  private client: OpenAI;

  constructor(modelName: string = 'gpt-4o', apiKey?: string) {
    this.modelName = modelName;
    const key = apiKey || process.env.OPENAI_API_KEY || '';
    this.client = new OpenAI({ apiKey: key });
  }

  async generateChallenge(params: GenerateChallengeParams): Promise<GeneratedChallenge> {
    const prompt = buildChallengePrompt(params);

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert technical assessment creator. Respond strictly with a valid JSON object matching the requested schema.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error(`OpenAI returned empty response for model ${this.modelName}`);
    }

    const parsedJson = JSON.parse(content);
    return GeneratedChallengeSchema.parse(parsedJson);
  }

  async generateFeedback(params: FeedbackGenerationParams): Promise<string> {
    const prompt = buildFeedbackPrompt(params);

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert technical interviewer giving detailed pedagogical feedback on coding challenges.',
        },
        { role: 'user', content: prompt },
      ],
    });

    return response.choices[0]?.message?.content || 'Unable to generate feedback at this time.';
  }
}
