import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from './error';

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errorMessages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return next(new ValidationError(errorMessages));
      }
      return next(err);
    }
  };
}
