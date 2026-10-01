'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseSessionTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export interface UseSessionTimerReturn {
  remainingSeconds: number;
  formattedTime: string;
  isExpired: boolean;
  isNearExpiry: boolean; // Less than 5 minutes left
}

export function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculateRemainingSeconds(expiresAtIso: string): number {
  const target = new Date(expiresAtIso).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((target - now) / 1000));
}

export function useSessionTimer({
  expiresAt,
  onExpire,
}: UseSessionTimerProps): UseSessionTimerReturn {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    calculateRemainingSeconds(expiresAt),
  );
  const hasExpiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const checkExpiry = useCallback((remaining: number) => {
    if (remaining <= 0 && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      if (onExpireRef.current) {
        onExpireRef.current();
      }
    }
  }, []);

  useEffect(() => {
    hasExpiredRef.current = false;
    const initialRemaining = calculateRemainingSeconds(expiresAt);
    setRemainingSeconds(initialRemaining);
    checkExpiry(initialRemaining);

    if (initialRemaining <= 0) return;

    const interval = setInterval(() => {
      const remaining = calculateRemainingSeconds(expiresAt);
      setRemainingSeconds(remaining);
      checkExpiry(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, checkExpiry]);

  return {
    remainingSeconds,
    formattedTime: formatTime(remainingSeconds),
    isExpired: remainingSeconds <= 0,
    isNearExpiry: remainingSeconds > 0 && remainingSeconds <= 300,
  };
}
