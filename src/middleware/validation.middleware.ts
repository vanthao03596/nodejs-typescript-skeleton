import { Request, Response, NextFunction } from 'express';
import { ZodValidationError } from '../utils/errors';
import { z } from 'zod';

export type ValidationTarget = 'body' | 'query' | 'params';

export const validateRequest = <T extends z.ZodTypeAny>(
  schema: T,
  target: ValidationTarget = 'body'
) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dataToValidate = getValidationData(req, target);

      const validated = await schema.parseAsync(dataToValidate);

      if (target === 'body') req.body = validated;
      else if (target === 'query') req.query = validated as Request['query'];
      else if (target === 'params') req.params = validated as Request['params'];

      next();
    } catch (error) {
     if (error instanceof z.ZodError) {
        next(new ZodValidationError(error, target));
      } else {
        next(error);
      }
    }
  };
};

function getValidationData(req: Request, target: ValidationTarget) {
  switch (target) {
    case 'body':
      return req.body;
    case 'query':
      return req.query;
    case 'params':
      return req.params;
  }
}
