import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { RegisterInput, LoginInput } from './auth.validation';
import { successResponse, handleConflictError, handleAuthenticationError, handleNotFoundError } from '../../utils/response.utils';
import { HttpStatus } from '../../types/response.types';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: RegisterInput = req.body;
      const result = await authService.register(data);

      successResponse(res, result, 'User registered successfully', HttpStatus.CREATED);
    } catch (error) {
      if (error instanceof Error && error.message === 'User already exists') {
        handleConflictError(res, error.message);
        return;
      }
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: LoginInput = req.body;
      const result = await authService.login(data);

      successResponse(res, result, 'Login successful');
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        handleAuthenticationError(res, error.message);
        return;
      }
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        handleAuthenticationError(res, 'User not authenticated');
        return;
      }

      const user = await authService.getUserById(req.user.id);

      if (!user) {
        handleNotFoundError(res, 'User not found');
        return;
      }

      successResponse(res, { user }, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}