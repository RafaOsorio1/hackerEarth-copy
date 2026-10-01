'use client';

import React from 'react';
import { Play, Loader2, CheckCircle, XCircle, Terminal, Clock } from 'lucide-react';
import { TestExecutionResult } from '../services/webcontainer-runner';

interface TestConsoleProps {
  isRunning: boolean;
  testResult: TestExecutionResult | null;
  logs: string[];
  onRunTests: () => void;
}

export function TestConsole({ isRunning, testResult, logs, onRunTests }: TestConsoleProps) {
  return (
    <div className="flex flex-col h-full bg-slate-950 border-t border-slate-800 text-xs">
      {/* Console Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-slate-400" />
          <span className="font-semibold text-slate-300">Public Test Console</span>
          {testResult && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                testResult.passed
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {testResult.passed ? (
                <>
                  <CheckCircle className="h-3 w-3" /> All Tests Passed
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" /> Tests Failed
                </>
              )}
            </span>
          )}
          {testResult && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400 ml-2">
              <Clock className="h-3 w-3 text-slate-500" />
              {testResult.durationMs}ms (&lt; 3s SLA)
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={isRunning}
          onClick={onRunTests}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-950 transition-all disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Running Vitest...
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              Run Public Tests
            </>
          )}
        </button>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1 bg-slate-950/80">
        {logs.length === 0 ? (
          <div className="text-slate-500 italic">
            Click &ldquo;Run Public Tests&rdquo; to execute the test suite in your browser.
          </div>
        ) : (
          logs.map((log, idx) => {
            let color = 'text-slate-300';
            if (log.includes('✅') || log.includes('passed'))
              color = 'text-emerald-400 font-semibold';
            if (log.includes('❌') || log.includes('failed') || log.includes('Error'))
              color = 'text-rose-400 font-semibold';
            if (log.includes('⚡') || log.includes('📦') || log.includes('🧪'))
              color = 'text-sky-300';
            return (
              <div key={idx} className={`${color} leading-relaxed break-words`}>
                {log}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
