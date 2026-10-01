import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createAssessmentRouter } from '../routes';
import { AssessmentService } from '../services/assessment.service';
import { errorHandler } from '../../../shared/middleware/error-handler';
import { NotFoundError } from '../../../shared/errors/domain-errors';

describe('Assessment API Contract Tests (OpenAPI 3.1 Compliance)', () => {
  const mockService = {
    createSession: vi.fn(),
    getWorkspace: vi.fn(),
    saveSnapshot: vi.fn(),
  } as unknown as AssessmentService;

  const app = express();
  app.use(express.json());
  app.use('/api/assessments', createAssessmentRouter(mockService));
  app.use(errorHandler);

  it('POST /api/assessments should return 201 with valid session payload', async () => {
    vi.mocked(mockService.createSession).mockResolvedValue({
      sessionId: '11111111-1111-1111-1111-111111111111',
      exerciseId: '22222222-2222-2222-2222-222222222222',
      title: 'Real-Time Notification Banner',
      difficulty: 'Intermediate',
      technologies: ['React', 'TypeScript'],
      durationMinutes: 30,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      sessionMode: 'STANDARD',
      hasLivePreview: true,
    });

    const res = await request(app)
      .post('/api/assessments')
      .send({
        technologies: ['React', 'TypeScript'],
        reactDialect: 'TypeScript',
        difficulty: 'Intermediate',
        modelId: 'gemini-2.5-pro',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('sessionId');
    expect(res.body).toHaveProperty('exerciseId');
    expect(res.body.title).toBe('Real-Time Notification Banner');
    expect(res.body.durationMinutes).toBe(30);
    expect(res.body.hasLivePreview).toBe(true);
  });

  it('POST /api/assessments should reject with 400 if React is chosen without reactDialect', async () => {
    const res = await request(app)
      .post('/api/assessments')
      .send({
        technologies: ['React'],
        difficulty: 'Beginner',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST_PAYLOAD');
    expect(res.body.message).toContain('reactDialect');
  });

  it('POST /api/assessments should reject with 400 if technologies list is empty', async () => {
    const res = await request(app).post('/api/assessments').send({
      technologies: [],
      difficulty: 'Beginner',
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST_PAYLOAD');
  });

  it('GET /api/assessments/:id should return 200 with workspace files and zero private test leakage', async () => {
    vi.mocked(mockService.getWorkspace).mockResolvedValue({
      sessionId: '11111111-1111-1111-1111-111111111111',
      title: 'Real-Time Notification Banner',
      description: 'Build a notification component',
      technologies: ['React', 'TypeScript'],
      hasLivePreview: true,
      remainingSeconds: 1800,
      status: 'ACTIVE',
      files: [
        { path: 'src/Banner.tsx', content: 'export function Banner() {}', readOnly: false },
        {
          path: 'tests/public/render.test.tsx',
          content: 'test("renders", () => {})',
          readOnly: true,
        },
      ],
    });

    const res = await request(app).get('/api/assessments/11111111-1111-1111-1111-111111111111');

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Real-Time Notification Banner');
    expect(res.body.files).toHaveLength(2);
    expect(res.body.files.some((f: { path: string }) => f.path.includes('private'))).toBe(false);
  });

  it('GET /api/assessments/:id should return 404 if session is not found', async () => {
    vi.mocked(mockService.getWorkspace).mockRejectedValue(
      new NotFoundError('AssessmentSession', 'unknown-id'),
    );

    const res = await request(app).get('/api/assessments/unknown-id');

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('RESOURCE_NOT_FOUND');
  });
});
