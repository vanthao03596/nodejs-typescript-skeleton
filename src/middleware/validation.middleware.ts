import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validateRequest = <T extends z.ZodTypeAny>(schema: T) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (validated && typeof validated === 'object') {
        if ('body' in validated && validated.body) req.body = validated.body;
        if ('query' in validated && validated.query) {
          req.query = validated.query as Request['query'];
        }
        if ('params' in validated && validated.params) {
          req.params = validated.params as Request['params'];
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};