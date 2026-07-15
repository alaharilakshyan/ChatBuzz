import { Response } from 'express';

export interface StandardResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export function success<T>(res: Response, message: string, data: T, statusCode = 200): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

export function created<T>(res: Response, message: string, data: T): Response {
  return success(res, message, data, 201);
}

export function accepted<T>(res: Response, message: string, data: T): Response {
  return success(res, message, data, 202);
}

export function noContent(res: Response, message: string): Response {
  return res.status(204).json({
    success: true,
    message,
    data: null,
    timestamp: new Date().toISOString()
  });
}

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    previousCursor: string | null;
    hasNext: boolean;
  };
}

export function paginated<T>(res: Response, message: string, paginatedData: PaginatedData<T>): Response {
  return success(res, message, paginatedData);
}

export function error(res: Response, statusCode: number, message: string, errorCode: string): Response {
  return res.status(statusCode).json({
    success: false,
    error: message,
    errorCode,
    timestamp: new Date().toISOString()
  });
}
