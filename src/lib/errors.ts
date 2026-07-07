export class ApiError extends Error {
  status: number;
  code: string;
  details: any;

  constructor(status: number, code: string, message: string, details: any = null) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed', code = 'UNAUTHENTICATED', details: any = null) {
    super(401, code, message, details);
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Unauthorized action', code = 'UNAUTHORIZED', details: any = null) {
    super(403, code, message, details);
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', code = 'VALIDATION_ERROR', details: any = null) {
    super(400, code, message, details);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict occurred', code = 'CONFLICT', details: any = null) {
    super(409, code, message, details);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND', details: any = null) {
    super(404, code, message, details);
  }
}

export class DatabaseError extends ApiError {
  constructor(message = 'Database error', details: any = null) {
    super(500, 'DATABASE_ERROR', message, details);
  }
}
