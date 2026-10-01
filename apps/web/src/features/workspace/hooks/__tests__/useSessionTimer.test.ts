import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionTimer, formatTime, calculateRemainingSeconds } from '../useSessionTimer';

describe('useSessionTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should correctly format seconds to MM:SS', () => {
    expect(formatTime(1800)).toBe('30:00');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(9)).toBe('00:09');
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(-10)).toBe('00:00');
  });

  it('should calculate remaining seconds from authoritative ISO string', () => {
    const futureDate = new Date(Date.now() + 600 * 1000).toISOString();
    const remaining = calculateRemainingSeconds(futureDate);
    expect(remaining).toBe(600);

    const pastDate = new Date(Date.now() - 60 * 1000).toISOString();
    expect(calculateRemainingSeconds(pastDate)).toBe(0);
  });

  it('should countdown every second and trigger onExpire at 00:00', () => {
    const onExpire = vi.fn();
    const expiresAt = new Date(Date.now() + 3000).toISOString();

    const { result } = renderHook(() => useSessionTimer({ expiresAt, onExpire }));

    expect(result.current.remainingSeconds).toBe(3);
    expect(result.current.formattedTime).toBe('00:03');
    expect(result.current.isExpired).toBe(false);

    // Fast forward 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remainingSeconds).toBe(2);

    // Fast forward 2 more seconds -> reaches 0
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.isExpired).toBe(true);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('should flag isNearExpiry when 5 minutes or less remain', () => {
    const nearExpiryDate = new Date(Date.now() + 240 * 1000).toISOString(); // 4 minutes
    const { result } = renderHook(() => useSessionTimer({ expiresAt: nearExpiryDate }));

    expect(result.current.isNearExpiry).toBe(true);
  });
});
