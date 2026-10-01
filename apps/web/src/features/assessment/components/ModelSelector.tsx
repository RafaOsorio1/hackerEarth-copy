'use client';

import React from 'react';
import { Cpu, Check } from 'lucide-react';

export interface ModelOption {
  id: string;
  name: string;
  provider: 'Google' | 'OpenAI' | 'Anthropic';
  badge: string;
}

export const AVAILABLE_AI_MODELS: ModelOption[] = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    provider: 'Google',
    badge: 'Fast & Free',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    provider: 'Google',
    badge: 'Ultra Fast',
  },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', badge: 'High Accuracy' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', badge: 'Fast' },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    badge: 'Elite Coding',
  },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic', badge: 'Fast' },
];

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export function ModelSelector({ selectedModel, onSelectModel }: ModelSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <Cpu className="h-4 w-4 text-sky-400" />
        AI Assessment Engine &amp; Model
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {AVAILABLE_AI_MODELS.map((model) => {
          const isSelected = selectedModel === model.id;
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => onSelectModel(model.id)}
              className={`flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all min-h-[78px] ${
                isSelected
                  ? 'border-sky-500 bg-sky-500/10 text-white shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/40'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-start justify-between w-full gap-2">
                <span className="font-semibold text-xs text-white truncate">{model.name}</span>
                {isSelected ? (
                  <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                ) : (
                  <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50 shrink-0">
                    {model.badge}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between w-full mt-2 text-[11px] text-slate-500">
                <span>{model.provider}</span>
                {isSelected && (
                  <span className="text-[10px] font-medium text-sky-400 bg-sky-500/20 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
