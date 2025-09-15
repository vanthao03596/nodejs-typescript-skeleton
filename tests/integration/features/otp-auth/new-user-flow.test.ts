import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../../test-app';
import { prisma } from '../../../../src/config/database';
import { redis } from '../../../../src/config/redis';

// Mock database and redis connections for testing
vi.mock('../../../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('../../../../src/config/redis', () => ({
  redis: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    ping: vi.fn().mockResolvedValue('PONG'),
  },
}));

// Mock JWT utilities
vi.mock('../../../../src/utils/jwt.utils', () => ({
  generateToken: vi.fn(() => 'eyJhbGciOiJIUzI1NiIs...mock-jwt-token'),
}));

// Mock email service (development mode - console output)
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('OTP Auth - New User Registration Flow', () => {
  const testEmail = 'newuser@example.com';
  const mockOtpCode = '123456';
  const mockUserId = 1;
  const mockUser = {
    id: mockUserId,
    email: testEmail,
    name: null,
    password: null,
    created_via: 'otp',
    createdAt: new Date('2025-01-15T10:00:00Z'),
    updatedAt: new Date('2025-01-15T10:00:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Complete New User Registration Flow', () => {
    it('should successfully complete the full OTP registration flow for new user', async () => {
      // Step 1: Request OTP for new email (user doesn't exist)
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);
      (redis.set as vi.Mock).mockResolvedValue('OK');

      const otpRequestResponse = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ email: testEmail })
        .expect(200);

      expect(otpRequestResponse.body).toEqual({
        success: true,
        message: 'OTP sent successfully',
        data: {
          email: testEmail,
          expires_in: 600,
        },
      });

      // Verify OTP was stored in Redis with proper expiration
      expect(redis.set).toHaveBeenCalledWith(
        `otp:${testEmail}`,
        expect.any(String),
        'EX',
        600
      );

      // Verify console log for development mode OTP display
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(`[MockEmail] OTP Code for ${testEmail}:`)
      );

      // Step 2: Verify OTP (creates new user and returns JWT)
      (redis.get as vi.Mock).mockResolvedValue(mockOtpCode);
      (redis.del as vi.Mock).mockResolvedValue(1);
      (prisma.user.create as vi.Mock).mockResolvedValue(mockUser);

      const otpVerifyResponse = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: testEmail,
          code: mockOtpCode,
        })
        .expect(200);

      expect(otpVerifyResponse.body).toEqual({
        success: true,
        message: 'Authentication successful',
        data: {
          user: {
            id: mockUserId,
            email: testEmail,
            name: null,
            created_via: 'otp',
            created_at: '2025-01-15T10:00:00.000Z',
          },
          token: 'eyJhbGciOiJIUzI1NiIs...mock-jwt-token',
          expires_at: expect.any(String),
        },
      });

      // Verify user was created in database
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: testEmail,
          password: null,
          name: null,
          created_via: 'otp',
        },
        select: {
          id: true,
          email: true,
          name: true,
          created_via: true,
          createdAt: true,
        },
      });

      // Verify OTP was deleted from Redis after successful verification
      expect(redis.del).toHaveBeenCalledWith(`otp:${testEmail}`);
    });
  });

  describe('Step 1: OTP Request', () => {
    it('should request OTP for new email successfully', async () => {
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);
      (redis.set as vi.Mock).mockResolvedValue('OK');

      const response = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ email: testEmail })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'OTP sent successfully',
        data: {
          email: testEmail,
          expires_in: 600,
        },
      });

      expect(redis.set).toHaveBeenCalledWith(
        `otp:${testEmail}`,
        expect.any(String),
        'EX',
        600
      );
    });

    it('should handle OTP request for existing user email', async () => {
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser);
      (redis.set as vi.Mock).mockResolvedValue('OK');

      const response = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ email: testEmail })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'OTP sent successfully',
        data: {
          email: testEmail,
          expires_in: 600,
        },
      });
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'VALIDATION_ERROR',
      });
    });

    it('should require email field', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'VALIDATION_ERROR',
      });
    });

    it('should handle rate limiting for OTP requests', async () => {
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);
      (redis.set as vi.Mock).mockResolvedValue('OK');

      // First request should succeed
      await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ email: testEmail })
        .expect(200);

      // Immediate second request should be rate limited
      const response = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ email: testEmail })
        .expect(429);

      expect(response.body).toMatchObject({
        success: false,
        error: 'RATE_LIMIT_ERROR',
      });
    });
  });

  describe('Step 2: OTP Verification', () => {
    it('should verify OTP and create new user successfully', async () => {
      (redis.get as vi.Mock).mockResolvedValue(mockOtpCode);
      (redis.del as vi.Mock).mockResolvedValue(1);
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.user.create as vi.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: testEmail,
          code: mockOtpCode,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Authentication successful',
        data: {
          user: {
            id: mockUserId,
            email: testEmail,
            name: null,
            created_via: 'otp',
          },
          token: expect.any(String),
          expires_at: expect.any(String),
        },
      });

      expect(prisma.user.create).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith(`otp:${testEmail}`);
    });

    it('should handle existing user OTP verification', async () => {
      (redis.get as vi.Mock).mockResolvedValue(mockOtpCode);
      (redis.del as vi.Mock).mockResolvedValue(1);
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: testEmail,
          code: mockOtpCode,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Authentication successful',
        data: {
          user: expect.objectContaining({
            email: testEmail,
          }),
          token: expect.any(String),
        },
      });

      // Should not create new user
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should reject invalid OTP code', async () => {
      (redis.get as vi.Mock).mockResolvedValue(mockOtpCode);

      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: testEmail,
          code: '999999',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'INVALID_OTP',
        message: 'Invalid or expired OTP code',
      });

      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should reject expired OTP', async () => {
      (redis.get as vi.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: testEmail,
          code: mockOtpCode,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'INVALID_OTP',
        message: 'Invalid or expired OTP code',
      });
    });

    it('should validate email format for verification', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: 'invalid-email',
          code: mockOtpCode,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'VALIDATION_ERROR',
      });
    });

    it('should validate OTP code format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: testEmail,
          code: '12345', // Too short
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'VALIDATION_ERROR',
      });
    });

    it('should require both email and code fields', async () => {
      const response1 = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ email: testEmail })
        .expect(400);

      const response2 = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ code: mockOtpCode })
        .expect(400);

      expect(response1.body).toMatchObject({
        success: false,
        error: 'VALIDATION_ERROR',
      });

      expect(response2.body).toMatchObject({
        success: false,
        error: 'VALIDATION_ERROR',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors during OTP request', async () => {
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);
      (redis.set as vi.Mock).mockRejectedValue(new Error('Redis connection failed'));

      const response = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ email: testEmail })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
      });
    });

    it('should handle database connection errors during user creation', async () => {
      (redis.get as vi.Mock).mockResolvedValue(mockOtpCode);
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.user.create as vi.Mock).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: testEmail,
          code: mockOtpCode,
        })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
      });
    });

    it('should handle malformed request bodies', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/request')
        .send('invalid-json-string')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
      });
    });
  });

  describe('Security Considerations', () => {
    it('should not expose OTP codes in response headers or body', async () => {
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);
      (redis.set as vi.Mock).mockResolvedValue('OK');

      const response = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ email: testEmail });

      expect(response.body.data).not.toHaveProperty('code');
      expect(response.body.data).not.toHaveProperty('otp');
      expect(response.headers).not.toHaveProperty('x-otp-code');
    });

    it('should implement proper rate limiting per email', async () => {
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);
      (redis.set as vi.Mock).mockResolvedValue('OK');

      // Different emails should not share rate limit
      await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ email: 'user1@example.com' })
        .expect(200);

      await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ email: 'user2@example.com' })
        .expect(200);
    });

    it('should clear OTP from Redis after successful verification', async () => {
      (redis.get as vi.Mock).mockResolvedValue(mockOtpCode);
      (redis.del as vi.Mock).mockResolvedValue(1);
      (prisma.user.findUnique as vi.Mock).mockResolvedValue(null);
      (prisma.user.create as vi.Mock).mockResolvedValue(mockUser);

      await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: testEmail,
          code: mockOtpCode,
        })
        .expect(200);

      expect(redis.del).toHaveBeenCalledWith(`otp:${testEmail}`);
    });
  });
});