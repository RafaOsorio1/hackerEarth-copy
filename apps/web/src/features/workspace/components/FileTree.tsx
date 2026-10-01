'use client';

import React from 'react';
import { FileCode, FileText, Lock, Folder } from 'lucide-react';

export interface WorkspaceFileItem {
  path: string;
  content: string;
  readOnly: boolean;
}

interface FileTreeProps {
  files: WorkspaceFileItem[];
  activeFilePath: string;
  onSelectFile: (path: string) => void;
}

export function FileTree({ files, activeFilePath, onSelectFile }: FileTreeProps) {
  const getFileIcon = (path: string, readOnly: boolean) => {
    if (readOnly) {
      return <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
    }
    if (path.endsWith('.tsx') || path.endsWith('.jsx')) {
      return <FileCode className="h-3.5 w-3.5 text-sky-400 shrink-0" />;
    }
    if (path.endsWith('.ts') || path.endsWith('.js')) {
      return <FileCode className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
    }
    return <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800 select-none text-xs">
      <div className="p-3 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Folder className="h-3.5 w-3.5 text-slate-500" />
        Project Explorer
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {files.map((file) => {
          const isActive = file.path === activeFilePath;
          return (
            <button
              key={file.path}
              type="button"
              onClick={() => onSelectFile(file.path)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-slate-800/90 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {getFileIcon(file.path, file.readOnly)}
                <span className="truncate">{file.path}</span>
              </div>
              {file.readOnly && (
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 ml-1">
                  Locked
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
