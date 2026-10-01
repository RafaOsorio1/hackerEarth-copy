'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Scorecard, TestOutputItem } from '@/features/evaluation/components/Scorecard';
import { Sparkles, PlusCircle, Loader2, AlertCircle, ArrowLeft, Flame } from 'lucide-react';

interface EvaluationData {
  numericScore: number;
  passedPrivateTests: number;
  totalPrivateTests: number;
  testOutputs: TestOutputItem[];
  aiFeedbackSummary: string;
}

export default function AssessmentResultsPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const sessionId = routeParams?.id || '';

  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingDrill, setIsStartingDrill] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    async function fetchResults() {
      try {
        const res = await fetch(`${apiUrl}/api/assessments/${sessionId}/results`);
        if (res.ok) {
          const data: EvaluationData = await res.json();
          setEvaluation(data);
          setLoading(false);
          return;
        }

        // If 400 (not evaluated yet), poll
        if (res.status === 400 && attempts < maxAttempts) {
          attempts++;
          setTimeout(fetchResults, 1500);
          return;
        }

        const errData = await res.json().catch(() => ({}));
        setError(errData.message || 'Failed to retrieve assessment evaluation results.');
        setLoading(false);
      } catch (err: unknown) {
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(fetchResults, 1500);
          return;
        }
        setError(err instanceof Error ? err.message : 'Network error loading results.');
        setLoading(false);
      }
    }

    fetchResults();
  }, [sessionId]);

  const handleSpeedDrillRetry = async () => {
    setIsStartingDrill(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/assessments/${sessionId}/speed-drill`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to launch speed drill retry');
      }

      const data = await res.json();
      router.push(`/assessment/${data.sessionId}`);
    } catch (err) {
      console.error('Failed to start speed drill:', err);
      setIsStartingDrill(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white gap-4 p-4 text-center">
        <div className="p-4 rounded-full bg-sky-500/10 border border-sky-500/20">
          <Loader2 className="h-10 w-10 animate-spin text-sky-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Running Sandbox Private Tests...</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          Executing private test suites in our isolated runtime and generating AI pedagogical
          feedback. This usually takes 3 to 6 seconds.
        </p>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white gap-4 p-4 text-center">
        <AlertCircle className="h-12 w-12 text-rose-400" />
        <h2 className="text-xl font-bold text-white">Evaluation Report Unavailable</h2>
        <p className="text-xs text-slate-400 max-w-md">{error}</p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mt-4 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-all"
        >
          Return to Practice Setup
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Back to Home"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-400" />
              Assessment Scorecard &amp; Review
            </h1>
            <p className="text-[11px] text-slate-400">
              Evaluated against authoritative hidden private test suites
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all shadow-sm"
          >
            <PlusCircle className="h-3.5 w-3.5 text-sky-400" />
            New Challenge
          </button>

          <button
            type="button"
            onClick={handleSpeedDrillRetry}
            disabled={isStartingDrill}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 transition-all disabled:opacity-50"
          >
            {isStartingDrill ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Resetting Workspace...
              </>
            ) : (
              <>
                <Flame className="h-3.5 w-3.5 text-slate-950" />
                Speed Drill Retry
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10">
        <Scorecard
          score={evaluation.numericScore}
          passedPrivateTests={evaluation.passedPrivateTests}
          totalPrivateTests={evaluation.totalPrivateTests}
          testOutputs={evaluation.testOutputs}
          aiFeedbackSummary={evaluation.aiFeedbackSummary}
        />
      </main>
    </div>
  );
}
