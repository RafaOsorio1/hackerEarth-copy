'use client';

import React, { useState } from 'react';
import { ModelSelector } from './ModelSelector';
import { useCreateAssessment } from '../hooks/useCreateAssessment';
import { Code2, Clock, Zap, Layers, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

const AVAILABLE_TECH = [
  { id: 'HTML', label: 'HTML5', category: 'Frontend' },
  { id: 'CSS', label: 'CSS3', category: 'Frontend' },
  { id: 'JavaScript', label: 'JavaScript', category: 'Language' },
  { id: 'TypeScript', label: 'TypeScript', category: 'Language' },
  { id: 'React', label: 'React', category: 'Frontend' },
  { id: 'NodeJS', label: 'Node.js', category: 'Backend' },
];

const DIFFICULTIES = [
  { id: 'Beginner', label: 'Junior / Beginner', desc: 'Core fundamentals & straightforward logic' },
  { id: 'Intermediate', label: 'Mid-Level', desc: 'Complex state, edge cases & real-time UI' },
  {
    id: 'Advanced',
    label: 'Senior / Staff',
    desc: 'Architectural agility, perf & high scalability',
  },
];

export function PracticeSetup() {
  const [selectedTech, setSelectedTech] = useState<string[]>(['React', 'TypeScript']);
  const [reactDialect, setReactDialect] = useState<'TypeScript' | 'JavaScript'>('TypeScript');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(
    'Intermediate',
  );
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3-flash-preview');

  const { createAssessment, isLoading, error } = useCreateAssessment();

  const toggleTech = (techId: string) => {
    setSelectedTech((prev) =>
      prev.includes(techId)
        ? prev.length > 1
          ? prev.filter((t) => t !== techId)
          : prev
        : [...prev, techId],
    );
  };

  const handleLaunch = async () => {
    await createAssessment({
      technologies: selectedTech,
      reactDialect: selectedTech.includes('React') ? reactDialect : undefined,
      difficulty,
      modelId: selectedModel,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-2xl">
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Zap className="h-3.5 w-3.5" />
            Interview Speed Simulator
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Configure Coding Challenge
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Dynamic AI generator tailored to your stack with non-negotiable countdown pressure.
          </p>
        </div>
      </div>

      <div className="space-y-8 mt-8">
        {/* Technology Multi-Selector */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Layers className="h-4 w-4 text-emerald-400" />
            Select Tech Stack (Multi-selection forms single integrated project)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {AVAILABLE_TECH.map((tech) => {
              const isSelected = selectedTech.includes(tech.id);
              return (
                <button
                  key={tech.id}
                  type="button"
                  onClick={() => toggleTech(tech.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all min-h-[52px] ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="font-semibold text-sm">{tech.label}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* React Dialect Selector (Conditional) */}
        {selectedTech.includes('React') && (
          <div className="p-4 rounded-2xl border border-sky-500/20 bg-sky-950/20 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5" />
              React Flavor / Dialect
            </label>
            <div className="flex gap-3">
              {(['TypeScript', 'JavaScript'] as const).map((flavor) => (
                <button
                  key={flavor}
                  type="button"
                  onClick={() => setReactDialect(flavor)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                    reactDialect === flavor
                      ? 'bg-sky-500 text-white border-sky-400 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  React ({flavor})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Selector */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Clock className="h-4 w-4 text-amber-400" />
            Target Seniority &amp; Difficulty
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DIFFICULTIES.map((diff) => {
              const isSelected = difficulty === diff.id;
              return (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setDifficulty(diff.id as 'Beginner' | 'Intermediate' | 'Advanced')}
                  className={`p-4 rounded-xl border text-left transition-all min-h-[92px] flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-sm text-white">{diff.label}</div>
                  <div className="text-xs text-slate-400 mt-1 leading-snug">{diff.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Model Selector */}
        <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} />

        {/* Non-Negotiable Timer Notice */}
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200 font-semibold">Strict Interview Pressure:</strong> The
            challenge time limit (20 to 60 minutes) is dynamically evaluated by the AI based on
            problem complexity and cannot be manually modified.
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Launch Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={handleLaunch}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white font-bold text-base shadow-xl shadow-emerald-500/20 hover:opacity-95 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating Challenge & Launching Sandbox...
            </>
          ) : (
            <>
              <Zap className="h-5 w-5 fill-current" />
              Launch Assessment Workspace
            </>
          )}
        </button>
      </div>
    </div>
  );
}
