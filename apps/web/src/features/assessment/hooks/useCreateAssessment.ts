'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface CreateAssessmentPayload {
  technologies: string[];
  reactDialect?: 'JavaScript' | 'TypeScript';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  modelId?: string;
}

export interface CreatedSession {
  sessionId: string;
  exerciseId: string;
  title: string;
  difficulty: string;
  technologies: string[];
  durationMinutes: number;
  startedAt: string;
  expiresAt: string;
  sessionMode: string;
  hasLivePreview: boolean;
}

export function useCreateAssessment() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAssessment = async (
    payload: CreateAssessmentPayload,
  ): Promise<CreatedSession | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create session (status ${res.status})`);
      }

      const session: CreatedSession = await res.json();
      router.push(`/assessment/${session.sessionId}`);
      return session;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An error occurred while generating challenge.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createAssessment,
    isLoading,
    error,
  };
}
