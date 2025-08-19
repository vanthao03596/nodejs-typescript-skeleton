import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { errorResponse, handleValidationError } from '../utils/response.utils';
import { ErrorCode } from '../types/response.types';

interface CustomError extends Error {
  statusCode?: number;
  status?: number;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Internal Server Error';
  let errorCode: ErrorCode | undefined;

  console.error('Error:', error);

  if (error instanceof ZodError) {
    handleValidationError(res, error);
    return;
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorCode = ErrorCode.INVALID_TOKEN;
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errorCode = ErrorCode.TOKEN_EXPIRED;
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    errorCode = ErrorCode.VALIDATION_ERROR;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = ErrorCode.VALIDATION_ERROR;
  } else if (statusCode >= 500) {
    errorCode = ErrorCode.INTERNAL_ERROR;
  }

  errorResponse(res, message, statusCode, errorCode, undefined, error.stack);
};

export const notFound = (req: Request, res: Response) => {
  errorResponse(res, `Route ${req.originalUrl} not found`, 404, ErrorCode.NOT_FOUND);
};