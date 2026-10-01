'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { FileTree, WorkspaceFileItem } from '@/features/workspace/components/FileTree';
import { MonacoEditor } from '@/features/workspace/components/MonacoEditor';
import { TestConsole } from '@/features/workspace/components/TestConsole';
import { LivePreviewFrame } from '@/features/preview/components/LivePreviewFrame';
import { TimeoutModal } from '@/features/workspace/components/TimeoutModal';
import { useSessionTimer } from '@/features/workspace/hooks/useSessionTimer';
import { useAutoSave } from '@/features/workspace/hooks/useAutoSave';
import {
  ClientTestRunner,
  TestExecutionResult,
} from '@/features/workspace/services/webcontainer-runner';
import { Clock, Send, Loader2, BookOpen, Check, Code } from 'lucide-react';

interface WorkspaceData {
  sessionId: string;
  title: string;
  description: string;
  technologies: string[];
  hasLivePreview: boolean;
  remainingSeconds: number;
  status: string;
  files: WorkspaceFileItem[];
}

export default function AssessmentWorkspacePage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const sessionId = routeParams?.id || '';

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<WorkspaceFileItem[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>('');
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'problem' | 'files'>('problem');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Test execution state
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResult, setTestResult] = useState<TestExecutionResult | null>(null);
  const [testLogs, setTestLogs] = useState<string[]>([]);

  // Fetch workspace data
  useEffect(() => {
    async function loadWorkspace() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/assessments/${sessionId}`);
        if (!res.ok) {
          notFound();
          return;
        }
        const data: WorkspaceData = await res.json();
        setWorkspace(data);
        setFiles(data.files);

        // Set default open file (first editable file)
        const firstEditable = data.files.find((f) => !f.readOnly) || data.files[0];
        if (firstEditable) {
          setActiveFilePath(firstEditable.path);
          setOpenTabs([firstEditable.path]);
        }
      } catch (err) {
        console.error('Failed to load workspace:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkspace();
  }, [sessionId]);

  // Expiration calculation: Date.now() + remainingSeconds * 1000
  const expiresAt = workspace
    ? new Date(Date.now() + workspace.remainingSeconds * 1000).toISOString()
    : new Date().toISOString();

  // Authoritative Timer Hook
  const { formattedTime, isExpired, isNearExpiry } = useSessionTimer({
    expiresAt,
    onExpire: () => {
      console.log('Timer expired! Locking workspace and showing TimeoutModal.');
    },
  });

  // Auto-Save Hook (every 30s per FR-009)
  const { isSaving, lastSavedAt } = useAutoSave({
    sessionId,
    files,
    intervalMs: 30000,
  });

  const activeFile = files.find((f) => f.path === activeFilePath) || files[0];

  const handleSelectFile = (path: string) => {
    setActiveFilePath(path);
    if (!openTabs.includes(path)) {
      setOpenTabs((prev) => [...prev, path]);
    }
  };

  const handleCloseTab = (path: string) => {
    const nextTabs = openTabs.filter((t) => t !== path);
    setOpenTabs(nextTabs);
    if (activeFilePath === path && nextTabs.length > 0) {
      setActiveFilePath(nextTabs[nextTabs.length - 1]!);
    }
  };

  const handleContentChange = (path: string, newContent: string) => {
    setFiles((prev) => prev.map((f) => (f.path === path ? { ...f, content: newContent } : f)));
  };

  const handleRunPublicTests = async () => {
    setIsRunningTests(true);
    setTestLogs([]);
    try {
      const result = await ClientTestRunner.runPublicTests(files, (log) => {
        setTestLogs((prev) => [...prev, log]);
      });
      setTestResult(result);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleSubmitSolution = async () => {
    setIsSubmitting(true);
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
          trigger: 'MANUAL',
          files: fileMap,
        }),
      });

      router.push(`/assessment/${sessionId}/results`);
    } catch (err) {
      console.error('Failed to submit solution:', err);
      router.push(`/assessment/${sessionId}/results`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !workspace || !activeFile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        <p className="text-sm text-slate-400">Loading assessment workspace &amp; files...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-sm text-white">
            <Code className="h-4 w-4 text-emerald-400" />
            <span>{workspace.title}</span>
          </div>
          <div className="flex gap-1">
            {workspace.technologies.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/50"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Center: Authoritative Countdown Timer */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider transition-all ${
              isExpired
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                : isNearExpiry
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-200 border border-slate-700'
            }`}
          >
            <Clock
              className={`h-3.5 w-3.5 ${isNearExpiry ? 'text-amber-400' : 'text-slate-400'}`}
            />
            <span>{formattedTime}</span>
            {isNearExpiry && !isExpired && (
              <span className="text-[10px] text-amber-400 font-semibold uppercase">Urgent</span>
            )}
            {isExpired && (
              <span className="text-[10px] text-rose-400 font-semibold uppercase">Expired</span>
            )}
          </div>

          {/* Auto-Save status indicator */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-sky-400" />
                <span>Saving...</span>
              </>
            ) : lastSavedAt ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span>Saved</span>
              </>
            ) : null}
          </div>
        </div>

        {/* Right Action: Submit */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSubmitSolution}
            disabled={isSubmitting || isExpired}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-white font-semibold text-xs shadow-md shadow-emerald-950 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Submit Solution
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Split Panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Problem Instructions & File Tree */}
        <aside className="w-80 flex flex-col border-r border-slate-800 bg-slate-950">
          <div className="flex border-b border-slate-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('problem')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-all ${
                activeTab === 'problem'
                  ? 'border-b-2 border-b-sky-500 text-sky-400 bg-slate-900/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Instructions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('files')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-all ${
                activeTab === 'files'
                  ? 'border-b-2 border-b-sky-500 text-sky-400 bg-slate-900/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              Files ({files.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'problem' ? (
              <div className="p-4 space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">{workspace.title}</h3>
                  <div className="text-[11px] text-slate-400 whitespace-pre-line">
                    {workspace.description}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-sky-500/20 bg-sky-950/20 text-sky-300 space-y-1">
                  <strong className="block font-semibold">Public &amp; Private Tests</strong>
                  <p className="text-[11px] text-slate-400">
                    Run public tests anytime in the console below. Upon submitting, your solution
                    will be evaluated against hidden private test suites in our isolated sandbox.
                  </p>
                </div>
              </div>
            ) : (
              <FileTree
                files={files}
                activeFilePath={activeFilePath}
                onSelectFile={handleSelectFile}
              />
            )}
          </div>
        </aside>

        {/* Center Panel: Monaco Editor & Bottom Test Console */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              activeFile={activeFile}
              openTabs={openTabs}
              onSelectTab={setActiveFilePath}
              onCloseTab={handleCloseTab}
              onChangeContent={handleContentChange}
            />
          </div>

          <div className="h-48">
            <TestConsole
              isRunning={isRunningTests}
              testResult={testResult}
              logs={testLogs}
              onRunTests={handleRunPublicTests}
            />
          </div>
        </div>

        {/* Right Panel: Live UI Preview (if enabled) */}
        {workspace.hasLivePreview && (
          <aside className="w-96 flex flex-col">
            <LivePreviewFrame files={files} hasLivePreview={workspace.hasLivePreview} />
          </aside>
        )}
      </div>

      {/* Auto-Timeout Modal Dialog */}
      <TimeoutModal sessionId={sessionId} files={files} isOpen={isExpired} />
    </div>
  );
}
