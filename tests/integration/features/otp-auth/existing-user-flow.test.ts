import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../../test-app';

// Mock database and redis connections for testing
vi.mock('../../../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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

// Mock OTP generation utility
vi.mock('../../../../src/utils/otp.utils', () => ({
  generateOTP: vi.fn(() => '654321'),
  validateOTP: vi.fn(),
}));

// Mock email service
vi.mock('../../../../src/services/email.service', () => ({
  EmailService: vi.fn().mockImplementation(() => ({
    sendOTP: vi.fn().mockResolvedValue(true),
  })),
}));

// Mock JWT utils
vi.mock('../../../../src/utils/jwt.utils', () => ({
  generateToken: vi.fn(() => 'mock-jwt-token'),
}));

import { prisma } from '../../../../src/config/database';
import { redis } from '../../../../src/config/redis';
import { generateOTP, validateOTP } from '../../../../src/utils/otp.utils';
import { generateToken } from '../../../../src/utils/jwt.utils';

const mockPrisma = prisma;
const mockRedis = redis;
const mockGenerateOTP = generateOTP;
const mockValidateOTP = validateOTP;
const mockGenerateToken = generateToken;

describe('Existing User OTP Login Flow', () => {
  const existingUser = {
    id: 1,
    email: 'existing@example.com',
    name: 'Existing User',
    password: 'hashed-password',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/v1/auth/otp/request', () => {
    it('should successfully request OTP for existing user', async () => {
      // Mock finding existing user
      (mockPrisma.user.findUnique as any).mockResolvedValue(existingUser);

      // Mock Redis operations
      (mockRedis.set as any).mockResolvedValue('OK');

      // Mock OTP generation
      (mockGenerateOTP as any).mockReturnValue('654321');

      const response = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({
          email: 'existing@example.com',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('OTP sent');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('email', 'existing@example.com');

      // Verify user lookup was called
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'existing@example.com' },
      });

      // Verify OTP was stored in Redis
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('otp:existing@example.com'),
        '654321',
        'EX',
        expect.any(Number)
      );
    });

    it('should fail when user does not exist', async () => {
      // Mock user not found
      (mockPrisma.user.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('User not found');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('validation');
    });

    it('should fail when email is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('validation');
    });
  });

  describe('POST /api/v1/auth/otp/verify', () => {
    it('should successfully verify OTP and return JWT token for existing user', async () => {
      // Mock finding existing user
      (mockPrisma.user.findUnique as any).mockResolvedValue(existingUser);

      // Mock Redis OTP retrieval
      (mockRedis.get as any).mockResolvedValue('654321');
      (mockRedis.del as any).mockResolvedValue(1);

      // Mock OTP validation
      (mockValidateOTP as any).mockReturnValue(true);

      // Mock JWT token generation
      (mockGenerateToken as any).mockReturnValue('mock-jwt-token');

      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: 'existing@example.com',
          code: '654321',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Login successful');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token', 'mock-jwt-token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toMatchObject({
        id: 1,
        email: 'existing@example.com',
        name: 'Existing User',
      });
      expect(response.body.data.user).not.toHaveProperty('password');

      // Verify user lookup was called
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'existing@example.com' },
      });

      // Verify OTP was retrieved from Redis
      expect(mockRedis.get).toHaveBeenCalledWith(
        expect.stringContaining('otp:existing@example.com')
      );

      // Verify OTP was deleted from Redis after verification
      expect(mockRedis.del).toHaveBeenCalledWith(
        expect.stringContaining('otp:existing@example.com')
      );

      // Verify JWT token generation
      expect(mockGenerateToken).toHaveBeenCalledWith({
        userId: 1,
        email: 'existing@example.com',
      });
    });

    it('should fail when user does not exist', async () => {
      // Mock user not found
      (mockPrisma.user.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: 'nonexistent@example.com',
          code: '654321',
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('User not found');
    });

    it('should fail when OTP is invalid or expired', async () => {
      // Mock finding existing user
      (mockPrisma.user.findUnique as any).mockResolvedValue(existingUser);

      // Mock Redis OTP retrieval returns null (expired/not found)
      (mockRedis.get as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: 'existing@example.com',
          code: '654321',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid or expired OTP');
    });

    it('should fail when OTP code does not match', async () => {
      // Mock finding existing user
      (mockPrisma.user.findUnique as any).mockResolvedValue(existingUser);

      // Mock Redis OTP retrieval returns different code
      (mockRedis.get as any).mockResolvedValue('123456');

      // Mock OTP validation returns false
      (mockValidateOTP as any).mockReturnValue(false);

      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: 'existing@example.com',
          code: '654321', // Different from stored '123456'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid OTP');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: 'invalid-email',
          code: '654321',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('validation');
    });

    it('should fail when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: 'existing@example.com',
          // Missing code
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('validation');
    });

    it('should fail when OTP code format is invalid', async () => {
      const response = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: 'existing@example.com',
          code: '12345', // Invalid length (should be 6 digits)
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('validation');
    });
  });

  describe('Complete Flow Integration', () => {
    it('should complete the full existing user OTP login flow', async () => {
      // Step 1: Request OTP for existing user
      (mockPrisma.user.findUnique as any).mockResolvedValue(existingUser);
      (mockRedis.set as any).mockResolvedValue('OK');
      (mockGenerateOTP as any).mockReturnValue('654321');

      const requestResponse = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({
          email: 'existing@example.com',
        })
        .expect(200);

      expect(requestResponse.body.success).toBe(true);
      expect(requestResponse.body.message).toContain('OTP sent');

      // Step 2: Verify OTP and get JWT token
      (mockPrisma.user.findUnique as any).mockResolvedValue(existingUser);
      (mockRedis.get as any).mockResolvedValue('654321');
      (mockRedis.del as any).mockResolvedValue(1);
      (mockValidateOTP as any).mockReturnValue(true);
      (mockGenerateToken as any).mockReturnValue('mock-jwt-token');

      const verifyResponse = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({
          email: 'existing@example.com',
          code: '654321',
        })
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.message).toContain('Login successful');
      expect(verifyResponse.body.data.token).toBe('mock-jwt-token');
      expect(verifyResponse.body.data.user.email).toBe('existing@example.com');
    });
  });
});