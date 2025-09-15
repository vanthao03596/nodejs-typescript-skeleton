import { User, OtpRequest } from '@prisma/client';
import { prisma } from '../../config/database';
import { generateToken } from '../../utils/jwt.utils';
import { generateOtp } from '../../utils/otp.utils';
import { sendOtpEmail } from '../../utils/email.utils';
import { redis } from '../../config/redis';
import {
  ConflictError,
  AuthenticationError,
  RateLimitError,
  ValidationError
} from '../../utils/errors';
import { OtpRequestInput, OtpVerifyInput, OtpStatusInput } from './otp-auth.validation';

export interface OtpRequestResponse {
  email: string;
  expires_in: number;
}

export interface OtpVerifyResponse {
  user: Omit<User, 'password'>;
  token: string;
  expires_at: string;
}

export interface OtpStatusResponse {
  has_active_otp: boolean;
  expires_in_seconds?: number;
  attempts_used?: number;
  can_request_new: boolean;
  next_request_available_in?: number;
}

export class OtpAuthService {
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_OTP_ATTEMPTS = 5;
  private readonly RATE_LIMIT_WINDOW_MINUTES = 15;
  private readonly MAX_REQUESTS_PER_WINDOW = 3;

  async requestOtp(data: OtpRequestInput): Promise<OtpRequestResponse> {
    const email = data.email.toLowerCase().trim();

    // Check rate limiting
    await this.checkRateLimit(email);

    // Generate OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP in database
    await prisma.otpRequest.create({
      data: {
        email,
        code: otpCode,
        expiresAt,
        attempts: 0,
        used: false,
      },
    });

    // Send OTP via email
    try {
      await sendOtpEmail(email, otpCode);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      // Delete the OTP record if email sending fails
      await prisma.otpRequest.deleteMany({
        where: {
          email,
          code: otpCode,
        },
      });
      throw new Error('Failed to send OTP email');
    }

    // Update rate limiting counter
    await this.updateRateLimitCounter(email);

    return {
      email,
      expires_in: this.OTP_EXPIRY_MINUTES * 60, // in seconds
    };
  }

  async verifyOtp(data: OtpVerifyInput): Promise<OtpVerifyResponse> {
    const email = data.email.toLowerCase().trim();
    const { code } = data;

    // Find valid OTP
    const otpRequest = await prisma.otpRequest.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otpRequest) {
      throw new AuthenticationError('Invalid or expired OTP code');
    }

    // Check if OTP is blocked due to too many attempts
    if (otpRequest.attempts >= this.MAX_OTP_ATTEMPTS) {
      throw new AuthenticationError('OTP blocked due to too many failed attempts');
    }

    // Increment attempts on the OTP request
    await prisma.otpRequest.update({
      where: {
        id: otpRequest.id,
      },
      data: {
        attempts: otpRequest.attempts + 1,
      },
    });

    // Check if code matches (this increment was for successful verification)
    if (otpRequest.code !== code) {
      const remainingAttempts = this.MAX_OTP_ATTEMPTS - (otpRequest.attempts + 1);
      if (remainingAttempts <= 0) {
        throw new AuthenticationError('OTP blocked due to too many failed attempts');
      }
      throw new AuthenticationError(`Invalid OTP code. ${remainingAttempts} attempts remaining.`);
    }

    // Mark OTP as used
    await prisma.otpRequest.update({
      where: {
        id: otpRequest.id,
      },
      data: {
        used: true,
      },
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        createdVia: true,
        lastOtpAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      // Create new user with OTP authentication
      user = await prisma.user.create({
        data: {
          email,
          name: null, // Will be set to null for OTP-created users initially
          createdVia: 'otp',
          // password is optional for OTP users
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdVia: true,
          lastOtpAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Calculate token expiration (assuming 24h from JWT config)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Clean up expired OTP requests for this email
    await this.cleanupExpiredOtpRequests(email);

    return {
      user,
      token,
      expires_at: expiresAt,
    };
  }

  async getOtpStatus(data: OtpStatusInput): Promise<OtpStatusResponse> {
    const email = data.email.toLowerCase().trim();

    // Find active OTP
    const activeOtp = await prisma.otpRequest.findFirst({
      where: {
        email,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const now = Date.now();
    let hasActiveOtp = false;
    let expiresInSeconds: number | undefined;
    let attemptsUsed: number | undefined;

    if (activeOtp) {
      hasActiveOtp = true;
      expiresInSeconds = Math.max(0, Math.floor((activeOtp.expiresAt.getTime() - now) / 1000));
      attemptsUsed = activeOtp.attempts;
    }

    // Check if new request can be made (rate limiting)
    const rateLimitStatus = await this.getRateLimitStatus(email);

    return {
      has_active_otp: hasActiveOtp,
      ...(expiresInSeconds !== undefined && { expires_in_seconds: expiresInSeconds }),
      ...(attemptsUsed !== undefined && { attempts_used: attemptsUsed }),
      can_request_new: rateLimitStatus.canRequest,
      ...(rateLimitStatus.nextRequestAvailableIn && {
        next_request_available_in: rateLimitStatus.nextRequestAvailableIn
      }),
    };
  }

  private async checkRateLimit(email: string): Promise<void> {
    const rateLimitKey = `otp_rate_limit:${email}`;
    const currentCount = await redis.get(rateLimitKey);

    if (currentCount && parseInt(currentCount) >= this.MAX_REQUESTS_PER_WINDOW) {
      const ttl = await redis.ttl(rateLimitKey);
      throw new RateLimitError(
        `Too many OTP requests. Please try again later.`
      );
    }
  }

  private async updateRateLimitCounter(email: string): Promise<void> {
    const rateLimitKey = `otp_rate_limit:${email}`;
    const current = await redis.incr(rateLimitKey);

    if (current === 1) {
      // Set expiration only on first increment
      await redis.expire(rateLimitKey, this.RATE_LIMIT_WINDOW_MINUTES * 60);
    }
  }

  private async getRateLimitStatus(email: string): Promise<{
    canRequest: boolean;
    nextRequestAvailableIn?: number;
  }> {
    const rateLimitKey = `otp_rate_limit:${email}`;
    const currentCount = await redis.get(rateLimitKey);

    if (!currentCount || parseInt(currentCount) < this.MAX_REQUESTS_PER_WINDOW) {
      return { canRequest: true };
    }

    const ttl = await redis.ttl(rateLimitKey);
    return {
      canRequest: false,
      ...(ttl > 0 && { nextRequestAvailableIn: ttl }),
    };
  }

  private async cleanupExpiredOtpRequests(email: string): Promise<void> {
    await prisma.otpRequest.deleteMany({
      where: {
        email,
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}