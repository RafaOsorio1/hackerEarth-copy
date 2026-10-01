import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createAssessmentRouter } from '../routes';
import { AssessmentService } from '../services/assessment.service';
import { errorHandler } from '../../../shared/middleware/error-handler';
import {
  SessionExpiredError,
  SubmissionNotAllowedError,
} from '../../../shared/errors/domain-errors';

describe('Assessment Snapshot Contract Tests (PUT /api/assessments/:id/snapshot)', () => {
  const mockService = {
    createSession: vi.fn(),
    getWorkspace: vi.fn(),
    saveSnapshot: vi.fn(),
  } as unknown as AssessmentService;

  const app = express();
  app.use(express.json());
  app.use('/api/assessments', createAssessmentRouter(mockService));
  app.use(errorHandler);

  it('PUT /api/assessments/:id/snapshot should return 200 with savedAt timestamp on success', async () => {
    vi.mocked(mockService.saveSnapshot).mockResolvedValue({
      success: true,
      savedAt: '2026-10-01T12:00:00.000Z',
    });

    const res = await request(app)
      .put('/api/assessments/11111111-1111-1111-1111-111111111111/snapshot')
      .send({
        files: {
          'src/App.tsx': 'export default function App() { return <h1>Updated</h1>; }',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.savedAt).toBe('2026-10-01T12:00:00.000Z');
  });

  it('PUT /api/assessments/:id/snapshot should reject with 400 if files payload is missing or invalid', async () => {
    const res = await request(app)
      .put('/api/assessments/11111111-1111-1111-1111-111111111111/snapshot')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST_PAYLOAD');
  });

  it('PUT /api/assessments/:id/snapshot should return 403 when session has expired', async () => {
    vi.mocked(mockService.saveSnapshot).mockRejectedValue(
      new SessionExpiredError('11111111-1111-1111-1111-111111111111'),
    );

    const res = await request(app)
      .put('/api/assessments/11111111-1111-1111-1111-111111111111/snapshot')
      .send({
        files: { 'src/App.tsx': 'code' },
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('SESSION_EXPIRED');
  });

  it('PUT /api/assessments/:id/snapshot should return 409 when session is already submitted', async () => {
    vi.mocked(mockService.saveSnapshot).mockRejectedValue(
      new SubmissionNotAllowedError('Cannot save snapshot on already submitted assessment.'),
    );

    const res = await request(app)
      .put('/api/assessments/11111111-1111-1111-1111-111111111111/snapshot')
      .send({
        files: { 'src/App.tsx': 'code' },
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SUBMISSION_NOT_ALLOWED');
  });
});
