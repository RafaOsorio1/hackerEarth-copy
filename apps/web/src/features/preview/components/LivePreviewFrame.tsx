'use client';

import React, { useMemo } from 'react';
import { WorkspaceFileItem } from '../../workspace/components/FileTree';
import { Eye, RotateCw } from 'lucide-react';

interface LivePreviewFrameProps {
  files: WorkspaceFileItem[];
  hasLivePreview: boolean;
}

export function LivePreviewFrame({ files, hasLivePreview }: LivePreviewFrameProps) {
  const iframeContent = useMemo(() => {
    if (!hasLivePreview) return '';

    const htmlFile = files.find((f) => f.path.endsWith('.html'));
    const cssFiles = files.filter((f) => f.path.endsWith('.css'));
    const jsFiles = files.filter((f) => f.path.endsWith('.js') && !f.path.includes('.test.'));

    let htmlBody = htmlFile ? htmlFile.content : '';
    const styles = cssFiles.map((c) => `<style>${c.content}</style>`).join('\n');
    const scripts = jsFiles.map((j) => `<script>${j.content}</script>`).join('\n');

    if (!htmlBody) {
      // Fallback for React/JSX components
      const reactFile = files.find((f) => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));
      htmlBody = `
        <div id="root">
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h3 style="margin-top: 0; color: #0284c7;">UI Preview Active</h3>
            <p>Component: <code>${reactFile ? reactFile.path : 'App.tsx'}</code></p>
            <div id="preview-render" style="border: 2px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin-top: 12px; background: #f8fafc;">
              ${reactFile?.content ? 'Live React preview initialized.' : 'Waiting for code changes...'}
            </div>
          </div>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          ${styles}
        </head>
        <body style="margin: 0; background: #ffffff;">
          ${htmlBody}
          ${scripts}
        </body>
      </html>
    `;
  }, [files, hasLivePreview]);

  if (!hasLivePreview) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-500 bg-slate-950">
        <Eye className="h-8 w-8 text-slate-700 mb-2" />
        <p className="text-xs">Live Preview is not required for this backend challenge.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 select-none text-xs">
        <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
          <Eye className="h-3.5 w-3.5" />
          <span>Live UI Preview</span>
          <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.2 rounded font-normal ml-1">
            &lt; 1s Reactive
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            const iframe = document.getElementById(
              'assessment-preview-iframe',
            ) as HTMLIFrameElement;
            if (iframe) iframe.srcdoc = iframeContent;
          }}
          className="text-slate-400 hover:text-white p-1 rounded"
          title="Reload preview"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 bg-white relative">
        <iframe
          id="assessment-preview-iframe"
          title="Live Preview Sandbox"
          srcDoc={iframeContent}
          sandbox="allow-scripts allow-modals"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}
