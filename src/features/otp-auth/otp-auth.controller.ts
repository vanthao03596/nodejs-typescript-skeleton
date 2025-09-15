import { Request, Response, NextFunction } from 'express';
import { OtpAuthService } from './otp-auth.service';
import { OtpRequestInput, OtpVerifyInput, OtpStatusInput } from './otp-auth.validation';
import { successResponse } from '../../utils/response.utils';
import { HttpStatus, ErrorCode } from '../../types/response.types';
import { RateLimitError, AuthenticationError } from '../../utils/errors';

const otpAuthService = new OtpAuthService();

export class OtpAuthController {
  /**
   * POST /api/v1/auth/otp/request
   * Request an OTP code to be sent to the specified email address
   */
  async requestOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.validatedBody as OtpRequestInput;
      const result = await otpAuthService.requestOtp(data);

      successResponse(
        res,
        result,
        'OTP sent successfully',
        HttpStatus.OK
      );
    } catch (error) {
      // Handle rate limiting with specific response structure per API contract
      if (error instanceof RateLimitError) {
        const rateLimitResponse = {
          success: false,
          message: 'Too many OTP requests. Please try again later.',
          error: {
            code: ErrorCode.RATE_LIMIT_EXCEEDED,
            details: 'Maximum 3 requests per 15 minutes'
          }
        };

        res.status(HttpStatus.TOO_MANY_REQUESTS).json(rateLimitResponse);
        return;
      }

      next(error);
    }
  }

  /**
   * POST /api/v1/auth/otp/verify
   * Verify the OTP code and authenticate the user
   */
  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.validatedBody as OtpVerifyInput;
      const result = await otpAuthService.verifyOtp(data);

      successResponse(
        res,
        result,
        'Authentication successful',
        HttpStatus.OK
      );
    } catch (error) {
      // Handle specific OTP verification errors per API contract
      if (error instanceof AuthenticationError) {
        // Check if it's a blocked OTP error
        if (error.message.includes('blocked due to too many failed attempts')) {
          const blockedResponse = {
            success: false,
            message: 'OTP blocked due to too many failed attempts',
            error: {
              code: ErrorCode.OTP_BLOCKED
            }
          };

          res.status(HttpStatus.FORBIDDEN).json(blockedResponse);
          return;
        }

        // Check if it's an invalid OTP with attempts remaining
        if (error.message.includes('attempts remaining')) {
          const attemptsMatch = error.message.match(/(\d+) attempts remaining/);
          const attemptsRemaining = attemptsMatch?.[1] ? parseInt(attemptsMatch[1], 10) : 0;

          const invalidOtpResponse = {
            success: false,
            message: 'Invalid or expired OTP code',
            error: {
              code: ErrorCode.INVALID_OTP,
              attempts_remaining: attemptsRemaining
            }
          };

          res.status(HttpStatus.BAD_REQUEST).json(invalidOtpResponse);
          return;
        }

        // Generic invalid OTP response
        const invalidOtpResponse = {
          success: false,
          message: 'Invalid or expired OTP code',
          error: {
            code: ErrorCode.INVALID_OTP
          }
        };

        res.status(HttpStatus.BAD_REQUEST).json(invalidOtpResponse);
        return;
      }

      next(error);
    }
  }

  /**
   * GET /api/v1/auth/otp/status
   * Check if there's an active OTP request for an email
   */
  async getOtpStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get email from query parameters (validated by middleware)
      const data = req.validatedQuery as OtpStatusInput;
      const result = await otpAuthService.getOtpStatus(data);

      successResponse(
        res,
        result,
        'OTP status retrieved successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }
}