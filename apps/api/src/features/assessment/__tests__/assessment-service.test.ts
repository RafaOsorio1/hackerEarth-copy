import { describe, it, expect, vi } from 'vitest';
import { AssessmentService } from '../services/assessment.service';
import { AssessmentRepository } from '../repositories/assessment.repository';
import { ChallengeGeneratorService } from '../../challenge/services/challenge-generator.service';
import { GeneratedChallenge } from '@hackerearth/ai';
import { NotFoundError } from '../../../shared/errors/domain-errors';

describe('AssessmentService', () => {
  const mockChallenge: GeneratedChallenge = {
    title: 'Filterable Activity Feed',
    description: 'Build an activity feed with tag filtering.',
    technologies: ['React', 'TypeScript'],
    difficulty: 'Intermediate',
    estimatedDurationMinutes: 30,
    starterFiles: [
      { path: 'src/Feed.tsx', content: 'export function Feed() {}', readOnly: false },
      { path: 'package.json', content: '{"name": "feed"}', readOnly: true },
    ],
    publicTests: [{ path: 'tests/public/render.test.tsx', content: 'test("renders", () => {})' }],
    privateTests: [
      { path: 'tests/private/edge.test.tsx', content: 'test("hidden edge case", () => {})' },
    ],
    canonicalSolution: [
      { path: 'src/Feed.tsx', content: 'export function Feed() { return <div>Items</div>; }' },
    ],
  };

  it('should create an active session with calculated expiration and duration', async () => {
    const mockRepo = {
      createSession: vi.fn().mockImplementation((data) => ({
        id: '11111111-1111-1111-1111-111111111111',
        userId: data.userId,
        exerciseId: '22222222-2222-2222-2222-222222222222',
        selectedTechnologies: data.selectedTechnologies,
        difficulty: data.difficulty,
        durationMinutes: data.durationMinutes,
        sessionMode: 'STANDARD',
        parentSessionId: null,
        startedAt: data.startedAt,
        expiresAt: data.expiresAt,
        status: 'ACTIVE',
        currentCodeSnapshot: data.currentCodeSnapshot,
        finalScore: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        exercise: {
          id: '22222222-2222-2222-2222-222222222222',
          title: data.exercise.title,
          description: data.exercise.description,
          technologies: data.exercise.technologies,
          difficulty: data.exercise.difficulty,
          hasLivePreview: data.exercise.hasLivePreview,
          estimatedDurationMinutes: data.exercise.estimatedDurationMinutes,
        },
      })),
      findSessionById: vi.fn(),
      updateSnapshot: vi.fn(),
      updateStatus: vi.fn(),
    } as unknown as AssessmentRepository;

    const mockGenerator = {
      generate: vi.fn().mockResolvedValue(mockChallenge),
    } as unknown as ChallengeGeneratorService;

    const service = new AssessmentService(mockRepo, mockGenerator);

    const session = await service.createSession({
      technologies: ['React', 'TypeScript'],
      difficulty: 'Intermediate',
      reactDialect: 'TypeScript',
    });

    expect(session.sessionId).toBe('11111111-1111-1111-1111-111111111111');
    expect(session.title).toBe('Filterable Activity Feed');
    expect(session.durationMinutes).toBe(30);
    expect(session.hasLivePreview).toBe(true);

    const started = new Date(session.startedAt).getTime();
    const expires = new Date(session.expiresAt).getTime();
    expect(expires - started).toBe(30 * 60 * 1000);
  });

  it('should withhold private tests when fetching workspace', async () => {
    const mockRepo = {
      createSession: vi.fn(),
      findSessionById: vi.fn().mockResolvedValue({
        id: '11111111-1111-1111-1111-111111111111',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        currentCodeSnapshot: {
          'src/Feed.tsx': 'export function Feed() { return null; }',
          'package.json': '{"name": "feed"}',
        },
        exercise: {
          id: '22222222-2222-2222-2222-222222222222',
          title: 'Filterable Activity Feed',
          description: 'Problem description here',
          technologies: ['React', 'TypeScript'],
          hasLivePreview: true,
          starterFiles: [
            { path: 'src/Feed.tsx', content: 'initial', readOnly: false },
            { path: 'package.json', content: '{"name": "feed"}', readOnly: true },
          ],
          publicTests: [
            { path: 'tests/public/render.test.tsx', content: 'test("public", () => {})' },
          ],
          privateTests: [
            { path: 'tests/private/edge.test.tsx', content: 'test("private secret", () => {})' },
          ],
          canonicalSolution: [{ path: 'src/Feed.tsx', content: 'secret canonical code' }],
        },
      }),
      updateSnapshot: vi.fn(),
      updateStatus: vi.fn(),
    } as unknown as AssessmentRepository;

    const service = new AssessmentService(mockRepo, {} as ChallengeGeneratorService);
    const workspace = await service.getWorkspace('11111111-1111-1111-1111-111111111111');

    expect(workspace.title).toBe('Filterable Activity Feed');
    expect(workspace.remainingSeconds).toBeGreaterThan(0);

    // Verify zero leakage of private tests or canonical solutions
    const filePaths = workspace.files.map((f) => f.path);
    expect(filePaths).toContain('src/Feed.tsx');
    expect(filePaths).toContain('tests/public/render.test.tsx');
    expect(filePaths).not.toContain('tests/private/edge.test.tsx');
    expect(filePaths).not.toContain('src/Feed.tsx.canonical');

    // Verify public test is locked as readOnly: true
    const publicTestFile = workspace.files.find((f) => f.path === 'tests/public/render.test.tsx');
    expect(publicTestFile?.readOnly).toBe(true);
  });

  it('should throw NotFoundError if session does not exist', async () => {
    const mockRepo = {
      findSessionById: vi.fn().mockResolvedValue(null),
    } as unknown as AssessmentRepository;

    const service = new AssessmentService(mockRepo, {} as ChallengeGeneratorService);
    await expect(service.getWorkspace('non-existent-id')).rejects.toThrow(NotFoundError);
  });
});
