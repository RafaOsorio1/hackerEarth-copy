import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Health Check Route', () => {
  const app = createApp();

  it('GET /api/health should return 200 with status ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', '@hackerearth/api');
    expect(res.body).toHaveProperty('timestamp');
  });
});
