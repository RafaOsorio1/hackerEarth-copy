'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { WorkspaceFileItem } from '../components/FileTree';

interface UseAutoSaveProps {
  sessionId: string;
  files: WorkspaceFileItem[];
  intervalMs?: number; // Defaults to 30,000ms (30 seconds per FR-009)
  onExpired?: () => void;
}

export function useAutoSave({ sessionId, files, intervalMs = 30000, onExpired }: UseAutoSaveProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filesRef = useRef(files);
  filesRef.current = files;

  const lastSavedSnapshotRef = useRef<string>('');

  const saveSnapshot = useCallback(async () => {
    const candidateFiles = filesRef.current.filter((f) => !f.readOnly);
    const fileMap: Record<string, string> = {};
    for (const f of candidateFiles) {
      fileMap[f.path] = f.content;
    }

    const currentSnapshotStr = JSON.stringify(fileMap);
    if (currentSnapshotStr === lastSavedSnapshotRef.current) {
      // No changes since last save
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/assessments/${sessionId}/snapshot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileMap }),
      });

      if (res.status === 403) {
        if (onExpired) onExpired();
        throw new Error('Session has expired. Further edits cannot be saved.');
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Auto-save failed.');
      }

      const data = await res.json();
      lastSavedSnapshotRef.current = currentSnapshotStr;
      setLastSavedAt(new Date(data.savedAt || Date.now()));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save snapshot');
    } finally {
      setIsSaving(false);
    }
  }, [sessionId, onExpired]);

  // Periodic interval saving every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      saveSnapshot();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [saveSnapshot, intervalMs]);

  return {
    isSaving,
    lastSavedAt,
    saveError,
    triggerSave: saveSnapshot,
  };
}
