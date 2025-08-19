import { AuthService } from '../../src/features/auth/auth.service';
import { hashPassword } from '../../src/utils/password.utils';
import { prisma } from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../../src/utils/password.utils', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock('../../src/utils/jwt.utils', () => ({
  generateToken: jest.fn(() => 'mock-token'),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockRegisterData = {
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test User',
    };

    it('should register a new user successfully', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hashed-password');
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({
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
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
      });

      await expect(authService.register(mockRegisterData))
        .rejects.toThrow('User already exists');
    });
  });
});