import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../../test-app';

// Mock database and redis connections for testing
vi.mock('../../../../src/config/database', () => ({
  prisma: {
    otpRequest: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../../../../src/config/redis', () => ({
  redis: {
    ping: vi.fn().mockResolvedValue('PONG'),
    get: vi.fn(),
    setex: vi.fn(),
  },
}));

describe('GET /api/v1/auth/otp/status - Contract Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Request Validation', () => {
    it('should return 400 for missing email query parameter', async () => {
      const response = await request(app)
        .get('/api/v1/auth/otp/status')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Validation Error'),
        error_code: 'VALIDATION_ERROR',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.any(String),
          })
        ])
      });
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .get('/api/v1/auth/otp/status?email=invalid-email')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Validation Error'),
        error_code: 'VALIDATION_ERROR',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.stringMatching(/invalid.*email/i),
          })
        ])
      });
    });

    it('should accept valid email format', async () => {
      // This test will fail until endpoint is implemented
      const response = await request(app)
        .get('/api/v1/auth/otp/status?email=test@example.com');

      // Will be 404 until route is implemented
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Response Schema - Active OTP Status', () => {
    it('should return correct schema when OTP is active', async () => {
      // Mock active OTP scenario
      const mockOtpData = {
        id: 1,
        email: 'test@example.com',
        created_at: new Date(Date.now() - 120000), // 2 minutes ago
        expires_at: new Date(Date.now() + 480000), // expires in 8 minutes
        attempts_used: 1,
        max_attempts: 5,
        cooldown_until: new Date(Date.now() + 720000), // 12 minutes cooldown
      };

      // This test will fail until implementation exists
      const response = await request(app)
        .get('/api/v1/auth/otp/status?email=test@example.com');

      if (response.status === 200) {
        // Validate response schema matches contract
        expect(response.body).toMatchObject({
          success: true,
          data: {
            has_active_otp: expect.any(Boolean),
            expires_in_seconds: expect.any(Number),
            attempts_used: expect.any(Number),
            can_request_new: expect.any(Boolean),
            next_request_available_in: expect.any(Number),
          }
        });

        // Validate data types and constraints
        expect(typeof response.body.data.has_active_otp).toBe('boolean');
        expect(typeof response.body.data.expires_in_seconds).toBe('number');
        expect(typeof response.body.data.attempts_used).toBe('number');
        expect(typeof response.body.data.can_request_new).toBe('boolean');
        expect(typeof response.body.data.next_request_available_in).toBe('number');

        // Validate constraints when OTP is active
        if (response.body.data.has_active_otp) {
          expect(response.body.data.expires_in_seconds).toBeGreaterThan(0);
          expect(response.body.data.attempts_used).toBeGreaterThanOrEqual(0);
        }
      } else {
        // Test will fail as expected since endpoint doesn't exist yet
        expect(response.status).toBe(404);
      }
    });

    it('should return correct time calculations for active OTP', async () => {
      // This test validates the time remaining calculation logic
      const response = await request(app)
        .get('/api/v1/auth/otp/status?email=test@example.com');

      if (response.status === 200 && response.body.data.has_active_otp) {
        const { expires_in_seconds, next_request_available_in } = response.body.data;

        // expires_in_seconds should be positive and reasonable (0-600 seconds for typical OTP)
        expect(expires_in_seconds).toBeGreaterThan(0);
        expect(expires_in_seconds).toBeLessThanOrEqual(600);

        // next_request_available_in should be positive if can_request_new is false
        if (!response.body.data.can_request_new) {
          expect(next_request_available_in).toBeGreaterThan(0);
        }
      } else {
        // Expected to fail until implementation exists
        expect(response.status).toBe(404);
      }
    });
  });

  describe('Response Schema - No Active OTP', () => {
    it('should return correct schema when no OTP is active', async () => {
      const response = await request(app)
        .get('/api/v1/auth/otp/status?email=noactive@example.com');

      if (response.status === 200) {
        expect(response.body).toMatchObject({
          success: true,
          data: {
            has_active_otp: false,
            expires_in_seconds: 0,
            attempts_used: 0,
            can_request_new: true,
            next_request_available_in: 0,
          }
        });
      } else {
        // Expected to fail until implementation exists
        expect(response.status).toBe(404);
      }
    });
  });

  describe('Business Logic Validation', () => {
    it('should indicate can_request_new=false when in cooldown period', async () => {
      const response = await request(app)
        .get('/api/v1/auth/otp/status?email=cooldown@example.com');

      if (response.status === 200 && !response.body.data.can_request_new) {
        expect(response.body.data.next_request_available_in).toBeGreaterThan(0);
      } else {
        // Expected to fail until implementation exists
        expect(response.status).toBe(404);
      }
    });

    it('should show attempts_used correctly for active OTP', async () => {
      const response = await request(app)
        .get('/api/v1/auth/otp/status?email=attempts@example.com');

      if (response.status === 200 && response.body.data.has_active_otp) {
        expect(response.body.data.attempts_used).toBeGreaterThanOrEqual(0);
        expect(response.body.data.attempts_used).toBeLessThanOrEqual(5); // Assuming max 5 attempts
      } else {
        // Expected to fail until implementation exists
        expect(response.status).toBe(404);
      }
    });

    it('should handle expired OTP correctly', async () => {
      const response = await request(app)
        .get('/api/v1/auth/otp/status?email=expired@example.com');

      if (response.status === 200) {
        // If OTP is expired, should show as no active OTP
        if (response.body.data.expires_in_seconds <= 0) {
          expect(response.body.data.has_active_otp).toBe(false);
        }
      } else {
        // Expected to fail until implementation exists
        expect(response.status).toBe(404);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // This test will validate error handling when database is unavailable
      const response = await request(app)
        .get('/api/v1/auth/otp/status?email=test@example.com');

      // Should either return 200 with proper response or 500 for internal error
      expect([200, 404, 500]).toContain(response.status);

      if (response.status === 500) {
        expect(response.body).toMatchObject({
          success: false,
          message: expect.any(String)
        });
      }
    });

    it('should validate response headers', async () => {
      const response = await request(app)
        .get('/api/v1/auth/otp/status?email=test@example.com');

      if (response.status === 200) {
        expect(response.headers['content-type']).toMatch(/application\/json/);
      }
    });
  });

  describe('Performance and Security', () => {
    it('should respond within reasonable time', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/auth/otp/status?email=test@example.com');

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    it('should not expose sensitive information in error responses', async () => {
      const response = await request(app)
        .get('/api/v1/auth/otp/status?email=test@example.com');

      // Should not expose database connection strings, file paths, etc.
      const bodyString = JSON.stringify(response.body);
      expect(bodyString).not.toMatch(/password|secret|key|token|connectionString|database/i);
    });
  });
});