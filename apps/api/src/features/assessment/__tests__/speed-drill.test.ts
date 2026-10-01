import { describe, it, expect, vi } from 'vitest';
import { SpeedDrillService } from '../services/speed-drill.service';
import { AssessmentRepository } from '../repositories/assessment.repository';
import { NotFoundError } from '../../../shared/errors/domain-errors';

describe('SpeedDrillService Unit Tests', () => {
  const mockRepo = {
    findSessionById: vi.fn(),
    createSession: vi.fn(),
  } as unknown as AssessmentRepository;

  const service = new SpeedDrillService(mockRepo);

  it('should reuse exercise, reset to clean starter files, and assign fresh countdown timer', async () => {
    const parentSessionId = '11111111-1111-1111-1111-111111111111';
    const exerciseId = '22222222-2222-2222-2222-222222222222';

    const starterFiles = [
      { path: 'src/index.ts', content: '// Clean starter code', readOnly: false },
      { path: 'package.json', content: '{}', readOnly: true },
    ];

    vi.mocked(mockRepo.findSessionById).mockResolvedValue({
      id: parentSessionId,
      userId: 'user-123',
      exerciseId,
      selectedTechnologies: ['TypeScript', 'NodeJS'],
      difficulty: 'Intermediate',
      durationMinutes: 30,
      sessionMode: 'STANDARD',
      parentSessionId: null,
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      expiresAt: new Date(Date.now() - 1800000), // Expired
      submittedAt: new Date(Date.now() - 1800000),
      status: 'EVALUATED',
      currentCodeSnapshot: { 'src/index.ts': '// Dirty candidate edits' },
      finalScore: 85,
      createdAt: new Date(),
      updatedAt: new Date(),
      exercise: {
        id: exerciseId,
        title: 'Async Rate Limiter',
        description: 'Build a token bucket rate limiter',
        technologies: ['TypeScript', 'NodeJS'],
        difficulty: 'Intermediate',
        architecturePattern: 'SINGLE_INTEGRATED_PROJECT',
        hasLivePreview: false,
        estimatedDurationMinutes: 30,
        starterFiles,
        publicTests: [],
        privateTests: [],
        canonicalSolution: [],
        validationStatus: 'VERIFIED',
        createdAt: new Date(),
      },
    } as any);

    vi.mocked(mockRepo.createSession).mockImplementation(async (data) => {
      return {
        id: '33333333-3333-3333-3333-333333333333',
        userId: data.userId,
        exerciseId,
        selectedTechnologies: data.selectedTechnologies,
        difficulty: data.difficulty,
        durationMinutes: data.durationMinutes,
        sessionMode: data.sessionMode,
        parentSessionId: data.parentSessionId,
        startedAt: data.startedAt,
        expiresAt: data.expiresAt,
        submittedAt: null,
        status: 'ACTIVE',
        currentCodeSnapshot: data.currentCodeSnapshot,
        finalScore: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        exercise: {
          id: exerciseId,
          title: 'Async Rate Limiter',
          hasLivePreview: false,
        },
      } as any;
    });

    const result = await service.createSpeedDrill(parentSessionId);

    expect(result.sessionId).toBe('33333333-3333-3333-3333-333333333333');
    expect(result.exerciseId).toBe(exerciseId);
    expect(result.sessionMode).toBe('SPEED_DRILL');
    expect(result.durationMinutes).toBe(30);

    // Verify fresh start and expiry
    const now = Date.now();
    const expiresAtMs = new Date(result.expiresAt).getTime();
    expect(expiresAtMs).toBeGreaterThan(now);

    // Verify repository called with clean starter files (not the dirty candidate snapshot)
    expect(mockRepo.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        parentSessionId,
        sessionMode: 'SPEED_DRILL',
        currentCodeSnapshot: {
          'src/index.ts': '// Clean starter code',
          'package.json': '{}',
        },
      }),
    );
  });

  it('should throw NotFoundError if parent session does not exist', async () => {
    vi.mocked(mockRepo.findSessionById).mockResolvedValue(null);

    await expect(service.createSpeedDrill('non-existent-id')).rejects.toThrow(NotFoundError);
  });
});
