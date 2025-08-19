import { User } from '@prisma/client';
import { prisma } from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password.utils';
import { generateToken } from '../../utils/jwt.utils';
import { RegisterInput, LoginInput } from './auth.validation';

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export class AuthService {
  async register(data: RegisterInput): Promise<AuthResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return { user, token };
  }

  async login(data: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const { password, ...userWithoutPassword } = user;

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return { user: userWithoutPassword, token };
  }

  async getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }
}