import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../test-app';

// Mock database and redis connections for testing
vi.mock('../../src/config/database', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
  },
}));

vi.mock('../../src/config/redis', () => ({
  redis: {
    ping: vi.fn().mockResolvedValue('PONG'),
  },
}));

describe('Health Endpoint', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('status', 'OK');
    expect(response.body.data).toHaveProperty('environment', 'test');
    expect(response.body.data.services).toHaveProperty('database', 'connected');
    expect(response.body.data.services).toHaveProperty('redis', 'connected');
  });

  it('should return API info on root endpoint', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: 'Node.js API Server',
      version: '1.0.0',
      environment: 'test',
    });
  });

  it('should return 404 for non-existent route', async () => {
    const response = await request(app)
      .get('/non-existent-route')
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body.message).toContain('not found');
  });
});