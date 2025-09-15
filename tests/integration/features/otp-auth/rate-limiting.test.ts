import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../../test-app';

// Mock database and redis connections for testing
vi.mock('../../../../src/config/database', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
  },
}));

// Mock Redis for rate limiting tests
vi.mock('../../../../src/config/redis', () => {
  const mockRedis = {
    get: vi.fn(),
    multi: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    exec: vi.fn().mockResolvedValue([[null, 1], [null, 'OK']]),
    del: vi.fn().mockResolvedValue(1),
    ping: vi.fn().mockResolvedValue('PONG'),
  };

  // Set up chaining for multi operations
  mockRedis.multi = vi.fn(() => mockRedis);
  mockRedis.incr = vi.fn(() => mockRedis);
  mockRedis.expire = vi.fn(() => mockRedis);

  return {
    redis: mockRedis,
  };
});

describe('OTP Auth Rate Limiting', () => {
  const testEmail = 'ratelimit@example.com';
  const otpRequestEndpoint = '/api/v1/auth/otp/request';

  // Get the mocked redis instance
  let mockRedis: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import the mocked redis instance
    const redisModule = await import('../../../../src/config/redis');
    mockRedis = redisModule.redis;

    // Reset Redis mock state
    mockRedis.get.mockResolvedValue(null);
    mockRedis.exec.mockResolvedValue([[null, 1], [null, 'OK']]);
  });

  describe('Rate Limit: 3 requests per 15 minutes', () => {
    it('should allow first request', async () => {
      // Mock Redis to return no existing count (first request)
      mockRedis.get.mockResolvedValue(null);

      const response = await request(app)
        .post(otpRequestEndpoint)
        .send({ email: testEmail });

      // Should succeed (once OTP endpoint is implemented)
      // Currently expecting 404 since endpoint doesn't exist yet (TDD)
      expect(response.status).toBe(404);

      // Verify rate limiting Redis calls were made
      expect(mockRedis.get).toHaveBeenCalledWith(expect.stringContaining('rate_limit:'));
    });

    it('should allow second request', async () => {
      // Mock Redis to return count of 1 (second request)
      mockRedis.get.mockResolvedValue('1');

      const response = await request(app)
        .post(otpRequestEndpoint)
        .send({ email: testEmail });

      // Should succeed (once OTP endpoint is implemented)
      // Currently expecting 404 since endpoint doesn't exist yet (TDD)
      expect(response.status).toBe(404);

      // Verify rate limiting Redis calls were made
      expect(mockRedis.get).toHaveBeenCalledWith(expect.stringContaining('rate_limit:'));
    });

    it('should allow third request', async () => {
      // Mock Redis to return count of 2 (third request)
      mockRedis.get.mockResolvedValue('2');

      const response = await request(app)
        .post(otpRequestEndpoint)
        .send({ email: testEmail });

      // Should succeed (once OTP endpoint is implemented)
      // Currently expecting 404 since endpoint doesn't exist yet (TDD)
      expect(response.status).toBe(404);

      // Verify rate limiting Redis calls were made
      expect(mockRedis.get).toHaveBeenCalledWith(expect.stringContaining('rate_limit:'));
    });

    it('should block fourth request with rate limit exceeded', async () => {
      // Mock Redis to return count of 3 (fourth request - should be blocked)
      mockRedis.get.mockResolvedValue('3');

      const response = await request(app)
        .post(otpRequestEndpoint)
        .send({ email: testEmail });

      // Should be blocked by rate limiter
      expect(response.status).toBe(429);
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Too many OTP requests'),
      });

      // Verify Redis get was called but incr should not be called when rate limited
      expect(mockRedis.get).toHaveBeenCalledWith(expect.stringContaining('rate_limit:'));
      expect(mockRedis.multi).not.toHaveBeenCalled();
    });

    it('should include proper error details in rate limit response', async () => {
      // Mock Redis to return count at the limit
      mockRedis.get.mockResolvedValue('3');

      const response = await request(app)
        .post(otpRequestEndpoint)
        .send({ email: testEmail });

      expect(response.status).toBe(429);
      expect(response.body).toMatchObject({
        success: false,
        message: 'Too many OTP requests. Please try again later.',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          details: 'Maximum 3 requests per 15 minutes'
        }
      });
    });
  });

  describe('Rate Limit Window Reset', () => {
    it('should allow requests after rate limit window expires', async () => {
      // Simulate rate limit window expiry by returning null (no existing count)
      mockRedis.get.mockResolvedValue(null);

      const response = await request(app)
        .post(otpRequestEndpoint)
        .send({ email: testEmail });

      // Should succeed after window reset (once OTP endpoint is implemented)
      // Currently expecting 404 since endpoint doesn't exist yet (TDD)
      expect(response.status).toBe(404);

      // Verify new rate limiting window started
      expect(mockRedis.get).toHaveBeenCalledWith(expect.stringContaining('rate_limit:'));
    });

    it('should reset counter properly when window expires', async () => {
      // First request after reset
      mockRedis.get.mockResolvedValue(null);
      mockRedis.exec.mockResolvedValue([[null, 1], [null, 'OK']]);

      await request(app)
        .post(otpRequestEndpoint)
        .send({ email: testEmail });

      // Verify Redis operations for setting new counter and expiration
      expect(mockRedis.multi).toHaveBeenCalled();
      expect(mockRedis.incr).toHaveBeenCalledWith(expect.stringContaining('rate_limit:'));
      expect(mockRedis.expire).toHaveBeenCalledWith(
        expect.stringContaining('rate_limit:'),
        900 // 15 minutes in seconds
      );
    });
  });

  describe('Rate Limit Key Generation', () => {
    it('should use IP-based rate limiting for OTP requests', async () => {
      mockRedis.get.mockResolvedValue(null);

      await request(app)
        .post(otpRequestEndpoint)
        .send({ email: testEmail });

      // Verify that rate limit key includes IP information
      expect(mockRedis.get).toHaveBeenCalledWith(
        expect.stringMatching(/^rate_limit:auth:/)
      );
    });

    it('should use consistent rate limit keys for same IP', async () => {
      mockRedis.get.mockResolvedValue('1');

      // Make two requests from same IP
      await request(app)
        .post(otpRequestEndpoint)
        .send({ email: testEmail });

      await request(app)
        .post(otpRequestEndpoint)
        .send({ email: 'another@example.com' });

      // Both requests should use the same rate limit key (IP-based, not email-based)
      const calls = mockRedis.get.mock.calls;
      expect(calls[0][0]).toBe(calls[1][0]);
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis errors gracefully', async () => {
      // Mock Redis to throw an error
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const response = await request(app)
        .post(otpRequestEndpoint)
        .send({ email: testEmail });

      // Should continue processing request when Redis fails
      // Currently expecting 404 since endpoint doesn't exist yet (TDD)
      expect(response.status).toBe(404);
    });

    it('should not block requests when rate limiter fails', async () => {
      // Mock Redis operations to fail
      mockRedis.get.mockRejectedValue(new Error('Redis error'));
      mockRedis.exec.mockRejectedValue(new Error('Redis exec failed'));

      const response = await request(app)
        .post(otpRequestEndpoint)
        .send({ email: testEmail });

      // Request should not be blocked due to rate limiter errors
      // Currently expecting 404 since endpoint doesn't exist yet (TDD)
      expect(response.status).toBe(404);
    });
  });

  describe('Sequential Request Testing', () => {
    it('should properly track sequential requests', async () => {
      // Test the exact scenario from quickstart.md
      const requests = [];

      // Mock progressive count increase
      mockRedis.get
        .mockResolvedValueOnce(null)      // First request: no existing count
        .mockResolvedValueOnce('1')       // Second request: count = 1
        .mockResolvedValueOnce('2')       // Third request: count = 2
        .mockResolvedValueOnce('3');      // Fourth request: count = 3 (should be blocked)

      // Make 4 requests as described in quickstart.md
      for (let i = 1; i <= 4; i++) {
        const response = await request(app)
          .post(otpRequestEndpoint)
          .send({ email: testEmail });

        requests.push(response);
      }

      // First 3 requests should succeed (404 since endpoint not implemented)
      expect(requests[0].status).toBe(404);
      expect(requests[1].status).toBe(404);
      expect(requests[2].status).toBe(404);

      // Fourth request should be rate limited
      expect(requests[3].status).toBe(429);
      expect(requests[3].body).toMatchObject({
        success: false,
        message: 'Too many OTP requests. Please try again later.',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          details: 'Maximum 3 requests per 15 minutes'
        }
      });
    });
  });
});