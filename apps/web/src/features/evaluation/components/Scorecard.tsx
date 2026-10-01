'use client';

import React from 'react';
import { CheckCircle2, XCircle, Clock, Sparkles, Award, Zap, FileCode } from 'lucide-react';

export interface TestOutputItem {
  testName: string;
  status: 'PASSED' | 'FAILED';
  errorMessage?: string;
  diff?: string;
  durationMs: number;
}

export interface ScorecardProps {
  score: number;
  passedPrivateTests: number;
  totalPrivateTests: number;
  testOutputs: TestOutputItem[];
  aiFeedbackSummary: string;
}

export function Scorecard({
  score,
  passedPrivateTests,
  totalPrivateTests,
  testOutputs,
  aiFeedbackSummary,
}: ScorecardProps) {
  const isPerfect = score === 100;
  const isPass = score >= 70;

  const scoreColor = isPerfect
    ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
    : isPass
      ? 'text-sky-400 border-sky-500/40 bg-sky-500/10'
      : 'text-rose-400 border-rose-500/40 bg-rose-500/10';

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Top Banner: Score and Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Score */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-wider font-semibold">
            <Award className="h-4 w-4 text-amber-400" />
            <span>Overall Score</span>
          </div>
          <div
            className={`text-5xl font-black font-mono px-5 py-2 rounded-2xl border ${scoreColor} shadow-inner`}
          >
            {score.toFixed(0)}%
          </div>
          <span className="text-xs text-slate-400">
            {isPerfect
              ? 'Outstanding performance!'
              : isPass
                ? 'Solid pass under time pressure.'
                : 'Needs speed & coverage refinement.'}
          </span>
        </div>

        {/* Private Tests Passed */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-wider font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Private Test Cases</span>
          </div>
          <div className="text-4xl font-extrabold text-white font-mono">
            {passedPrivateTests}{' '}
            <span className="text-slate-500 text-2xl font-normal">/ {totalPrivateTests}</span>
          </div>
          <span className="text-xs text-slate-400">
            {passedPrivateTests === totalPrivateTests
              ? '100% hidden assertions passed'
              : `${totalPrivateTests - passedPrivateTests} test case(s) failed or timed out`}
          </span>
        </div>

        {/* Speed & Optimization Status */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-wider font-semibold">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span>Agility &amp; Efficiency</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {isPerfect ? 'Interview Ready' : isPass ? 'Good Agility' : 'Speed Drill Advised'}
          </div>
          <span className="text-xs text-slate-400 text-center">
            Detailed AI review generated below
          </span>
        </div>
      </div>

      {/* Private Test Suite Breakdown */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCode className="h-4 w-4 text-sky-400" />
            Private Sandbox Verification Results
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {passedPrivateTests} of {totalPrivateTests} Passed
          </span>
        </div>

        <div className="space-y-3">
          {testOutputs.map((test, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border text-xs transition-all ${
                test.status === 'PASSED'
                  ? 'border-emerald-500/20 bg-emerald-950/10 text-slate-300'
                  : 'border-rose-500/30 bg-rose-950/20 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 font-medium">
                  {test.status === 'PASSED' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                  )}
                  <span className="font-semibold text-white">{test.testName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] flex-shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{test.durationMs}ms</span>
                </div>
              </div>

              {/* Failure Error Message & Diff */}
              {test.status === 'FAILED' && (
                <div className="mt-3 pl-6 space-y-2">
                  {test.errorMessage && (
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/20 text-rose-300 font-mono text-[11px]">
                      {test.errorMessage}
                    </div>
                  )}
                  {test.diff && (
                    <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                      <code>{test.diff}</code>
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Pedagogical Review */}
      <div className="p-6 rounded-2xl border border-sky-500/20 bg-gradient-to-b from-sky-950/20 to-slate-900/80 space-y-4">
        <div className="flex items-center gap-2 text-sky-400">
          <Sparkles className="h-5 w-5" />
          <h3 className="text-base font-bold text-white">AI Formative Feedback &amp; Speed Tips</h3>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/50 p-5 rounded-xl border border-slate-800/80 font-sans">
          {aiFeedbackSummary}
        </div>
      </div>
    </div>
  );
}
