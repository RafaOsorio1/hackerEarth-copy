import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createAssessmentRouter } from '../routes';
import { AssessmentService } from '../services/assessment.service';
import { EvaluationService } from '../../evaluation/services/evaluation.service';
import { errorHandler } from '../../../shared/middleware/error-handler';
import {
  SessionExpiredError,
  AssessmentNotEvaluatedError,
} from '../../../shared/errors/domain-errors';

describe('Submission & Results API Contract Tests (OpenAPI 3.1 Compliance)', () => {
  const mockAssessmentService = {
    createSession: vi.fn(),
    getWorkspace: vi.fn(),
    saveSnapshot: vi.fn(),
  } as unknown as AssessmentService;

  const mockEvaluationService = {
    submitAssessment: vi.fn(),
    getEvaluationResult: vi.fn(),
  } as unknown as EvaluationService;

  const app = express();
  app.use(express.json());
  app.use('/api/assessments', createAssessmentRouter(mockAssessmentService, mockEvaluationService));
  app.use(errorHandler);

  it('POST /api/assessments/:id/submit should return 202 with submission status', async () => {
    vi.mocked(mockEvaluationService.submitAssessment).mockResolvedValue({
      submissionId: '11111111-2222-3333-4444-555555555555',
      status: 'EVALUATING',
    });

    const res = await request(app)
      .post('/api/assessments/11111111-1111-1111-1111-111111111111/submit')
      .send({
        trigger: 'MANUAL',
        files: {
          'src/App.tsx': 'export default function App() { return <div>Hello</div>; }',
        },
      });

    expect(res.status).toBe(202);
    expect(res.body).toEqual({
      submissionId: '11111111-2222-3333-4444-555555555555',
      status: 'EVALUATING',
    });
  });

  it('POST /api/assessments/:id/submit should return 403 when session timer has expired', async () => {
    vi.mocked(mockEvaluationService.submitAssessment).mockRejectedValue(
      new SessionExpiredError('11111111-1111-1111-1111-111111111111'),
    );

    const res = await request(app)
      .post('/api/assessments/11111111-1111-1111-1111-111111111111/submit')
      .send({
        trigger: 'MANUAL',
        files: {
          'src/App.tsx': 'export default function App() {}',
        },
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('SESSION_EXPIRED');
  });

  it('POST /api/assessments/:id/submit should return 400 for invalid payload', async () => {
    const res = await request(app)
      .post('/api/assessments/11111111-1111-1111-1111-111111111111/submit')
      .send({
        trigger: 'INVALID_TRIGGER',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST_PAYLOAD');
  });

  it('GET /api/assessments/:id/results should return 200 with complete scorecard', async () => {
    vi.mocked(mockEvaluationService.getEvaluationResult).mockResolvedValue({
      numericScore: 100,
      passedPrivateTests: 3,
      totalPrivateTests: 3,
      testOutputs: [
        {
          testName: 'handles empty input gracefully',
          status: 'PASSED',
          durationMs: 45,
        },
        {
          testName: 'correctly filters items by search query',
          status: 'PASSED',
          durationMs: 32,
        },
        {
          testName: 'maintains state across updates',
          status: 'PASSED',
          durationMs: 50,
        },
      ],
      aiFeedbackSummary: 'Great solution! High speed and clean functional patterns.',
    });

    const res = await request(app).get(
      '/api/assessments/11111111-1111-1111-1111-111111111111/results',
    );

    expect(res.status).toBe(200);
    expect(res.body.numericScore).toBe(100);
    expect(res.body.passedPrivateTests).toBe(3);
    expect(res.body.totalPrivateTests).toBe(3);
    expect(res.body.testOutputs).toHaveLength(3);
    expect(res.body.aiFeedbackSummary).toContain('Great solution!');
  });

  it('GET /api/assessments/:id/results should return 400 if session is not yet evaluated', async () => {
    vi.mocked(mockEvaluationService.getEvaluationResult).mockRejectedValue(
      new AssessmentNotEvaluatedError('11111111-1111-1111-1111-111111111111'),
    );

    const res = await request(app).get(
      '/api/assessments/11111111-1111-1111-1111-111111111111/results',
    );

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('ASSESSMENT_NOT_EVALUATED');
  });
});
