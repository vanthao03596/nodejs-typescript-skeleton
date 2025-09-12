import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { AuthService } from '../../src/features/auth/auth.service';
import { hashPassword } from '../../src/utils/password.utils';
import { prisma } from '../../src/config/database';

vi.mock('../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('../../src/utils/password.utils', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}));

vi.mock('../../src/utils/jwt.utils', () => ({
  generateToken: vi.fn(() => 'mock-token'),
}));

const mockPrisma = prisma;
const mockHashPassword = hashPassword as Mock;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('register', () => {
    const mockRegisterData = {
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test User',
    };

    it('should register a new user successfully', async () => {
      (mockPrisma.user.findUnique as Mock).mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hashed-password');
      (mockPrisma.user.create as Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.register(mockRegisterData);

      expect(result).toEqual({
        user: expect.objectContaining({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        }),
        token: 'mock-token',
      });
    });

    it('should throw error if user already exists', async () => {
      (mockPrisma.user.findUnique as Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
      });

      await expect(authService.register(mockRegisterData))
        .rejects.toThrow('User already exists');
    });
  });
});