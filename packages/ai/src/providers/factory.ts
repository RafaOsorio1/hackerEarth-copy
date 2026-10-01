import { IAiModelProvider } from '../types';
import { GeminiProvider } from './gemini';
import { OpenAiProvider } from './openai';
import { ClaudeProvider } from './claude';

export type AvailableModel =
  | 'gemini-3-flash-preview'
  | 'gemini-3.1-flash-lite'
  | 'gemini-3.1-pro-preview'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'o3-mini'
  | 'claude-3-7-sonnet'
  | 'claude-3-5-haiku';

export const AVAILABLE_MODELS: Array<{ id: AvailableModel; label: string; provider: string }> = [
  {
    id: 'gemini-3-flash-preview',
    label: 'Google Gemini 3 Flash (Default & Free Tier)',
    provider: 'Google',
  },
  { id: 'gemini-3.1-flash-lite', label: 'Google Gemini 3.1 Flash Lite', provider: 'Google' },
  { id: 'gemini-3.1-pro-preview', label: 'Google Gemini 3.1 Pro (Preview)', provider: 'Google' },
  { id: 'gpt-4o', label: 'OpenAI GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', label: 'OpenAI GPT-4o Mini', provider: 'OpenAI' },
  { id: 'o3-mini', label: 'OpenAI o3-mini', provider: 'OpenAI' },
  { id: 'claude-3-7-sonnet', label: 'Anthropic Claude 3.7 Sonnet', provider: 'Anthropic' },
  { id: 'claude-3-5-haiku', label: 'Anthropic Claude 3.5 Haiku', provider: 'Anthropic' },
];

export function getAiModelProvider(modelId: string = 'gemini-3-flash-preview'): IAiModelProvider {
  if (modelId.startsWith('gemini')) {
    return new GeminiProvider(modelId);
  }
  if (modelId.startsWith('gpt') || modelId.startsWith('o3')) {
    return new OpenAiProvider(modelId);
  }
  if (modelId.startsWith('claude')) {
    const fullModel =
      modelId === 'claude-3-7-sonnet'
        ? 'claude-3-7-sonnet-20250219'
        : modelId === 'claude-3-5-haiku'
          ? 'claude-3-5-haiku-20241022'
          : modelId;
    return new ClaudeProvider(fullModel);
  }

  // Fallback to default active Gemini model
  return new GeminiProvider('gemini-3-flash-preview');
}

export const createAiProvider = getAiModelProvider;
