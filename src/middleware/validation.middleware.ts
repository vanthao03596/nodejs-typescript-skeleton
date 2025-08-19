import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validateRequest = <T extends z.ZodTypeAny>(schema: T) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (validated && typeof validated === 'object') {
        if ('body' in validated && validated.body) req.body = validated.body;
        if ('query' in validated && validated.query) req.query = validated.query as any;
        if ('params' in validated && validated.params) req.params = validated.params as any;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue: any) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages,
        });
        return;
      }
      next(error);
    }
  };
};