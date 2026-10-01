'use client';

import React, { useState } from 'react';
import { AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { WorkspaceFileItem } from './FileTree';

interface TimeoutModalProps {
  sessionId: string;
  files: WorkspaceFileItem[];
  isOpen: boolean;
}

export function TimeoutModal({ sessionId, files, isOpen }: TimeoutModalProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAutoSubmit = async () => {
    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const fileMap: Record<string, string> = {};
      for (const f of files) {
        fileMap[f.path] = f.content;
      }

      await fetch(`${apiUrl}/api/assessments/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger: 'AUTO_TIMEOUT',
          files: fileMap,
        }),
      });

      router.push(`/assessment/${sessionId}/results`);
    } catch (err) {
      console.error('Failed to auto-submit on timeout:', err);
      router.push(`/assessment/${sessionId}/results`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full p-6 rounded-2xl border border-rose-500/30 bg-slate-900 shadow-2xl text-center space-y-4">
        <div className="p-3 bg-rose-500/10 rounded-full w-fit mx-auto border border-rose-500/20">
          <AlertTriangle className="h-8 w-8 text-rose-400 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-white">Time Limit Expired!</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The authoritative assessment countdown has reached 00:00. Your workspace has been locked
          to preserve authentic interview integrity. Your latest code snapshot will now be evaluated
          against private test suites.
        </p>
        <button
          type="button"
          onClick={handleAutoSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-xs shadow-lg shadow-rose-950/50 transition-all disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              Submitting for Evaluation...
            </>
          ) : (
            <>
              View Evaluation &amp; Scorecard
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
