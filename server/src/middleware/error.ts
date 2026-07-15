import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { error as sendError } from '../utils/response';
import { ErrorCodes } from '../utils/errors';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errorCode: string
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, ErrorCodes.VALIDATION_FAILED);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, message, ErrorCodes.AUTH_REQUIRED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(403, message, ErrorCodes.PERMISSION_DENIED);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT_ERROR');
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    logger.warn({
      path: req.path,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      message: err.message
    }, `AppError: ${err.message}`);
    return sendError(res, err.statusCode, err.message, err.errorCode);
  }

  // Handle mongoose validation / cast errors
  if (err.name === 'ValidationError') {
    logger.warn({ path: req.path, err: err.message }, 'Mongoose ValidationError');
    return sendError(res, 400, err.message, ErrorCodes.VALIDATION_FAILED);
  }

  logger.error({
    path: req.path,
    stack: err.stack,
    message: err.message
  }, 'Uncaught Internal Server Error');

  return sendError(
    res,
    500,
    'An unexpected error occurred on the server.',
    ErrorCodes.INTERNAL_SERVER_ERROR
  );
}
