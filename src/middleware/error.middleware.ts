import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

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

  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    const errorMessages = error.issues.map((issue: any) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(statusCode).json({
      success: false,
      message,
      errors: errorMessages,
    });
    return;
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  if (error.name === 'ValidationError') {
    statusCode = 400;
  }

  const errorResponse: any = {
    success: false,
    message,
  };

  if (env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.error = error;
  }

  console.error('Error:', error);

  res.status(statusCode).json(errorResponse);
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route ${req.originalUrl} not found`) as CustomError;
  error.statusCode = 404;
  next(error);
};