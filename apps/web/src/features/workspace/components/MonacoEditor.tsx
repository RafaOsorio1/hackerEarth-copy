'use client';

import React from 'react';
import Editor from '@monaco-editor/react';
import { WorkspaceFileItem } from './FileTree';
import { Lock, X } from 'lucide-react';

interface MonacoEditorProps {
  activeFile: WorkspaceFileItem;
  openTabs: string[];
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  onChangeContent: (path: string, newContent: string) => void;
}

function getLanguageFromPath(path: string): string {
  if (path.endsWith('.tsx') || path.endsWith('.ts')) return 'typescript';
  if (path.endsWith('.jsx') || path.endsWith('.js')) return 'javascript';
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.md')) return 'markdown';
  return 'typescript';
}

export function MonacoEditor({
  activeFile,
  openTabs,
  onSelectTab,
  onCloseTab,
  onChangeContent,
}: MonacoEditorProps) {
  const language = getLanguageFromPath(activeFile.path);

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center bg-slate-950 border-b border-slate-800 overflow-x-auto select-none">
        {openTabs.map((path) => {
          const isActive = path === activeFile.path;
          const isLocked =
            activeFile.path === path
              ? activeFile.readOnly
              : path.includes('.test.') || path.endsWith('package.json');
          return (
            <div
              key={path}
              className={`flex items-center gap-2 px-3 py-2 text-xs border-r border-slate-800 cursor-pointer transition-all ${
                isActive
                  ? 'bg-slate-900 text-sky-400 border-t-2 border-t-sky-500 font-medium'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
              }`}
              onClick={() => onSelectTab(path)}
            >
              <span className="truncate max-w-[150px]">{path.split('/').pop()}</span>
              {isLocked && <Lock className="h-3 w-3 text-amber-400" />}
              {openTabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(path);
                  }}
                  className="hover:text-rose-400 p-0.5 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Read-only banner */}
      {activeFile.readOnly && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-amber-950/40 border-b border-amber-500/20 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            <span>
              This file is locked as <strong>Read-Only</strong> (Test assertions or configs cannot
              be altered during assessment).
            </span>
          </div>
        </div>
      )}

      {/* Editor View */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          value={activeFile.content}
          theme="vs-dark"
          options={{
            readOnly: activeFile.readOnly,
            fontSize: 13,
            lineHeight: 20,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            smoothScrolling: true,
          }}
          onChange={(val) => {
            if (!activeFile.readOnly && val !== undefined) {
              onChangeContent(activeFile.path, val);
            }
          }}
        />
      </div>
    </div>
  );
}
