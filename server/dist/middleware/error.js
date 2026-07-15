"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
exports.errorHandler = errorHandler;
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
class AppError extends Error {
    statusCode;
    message;
    errorCode;
    constructor(statusCode, message, errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errorCode = errorCode;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message) {
        super(400, message, errors_1.ErrorCodes.VALIDATION_FAILED);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(401, message, errors_1.ErrorCodes.AUTH_REQUIRED);
    }
}
exports.AuthenticationError = AuthenticationError;
class ForbiddenError extends AppError {
    constructor(message = 'Access denied') {
        super(403, message, errors_1.ErrorCodes.PERMISSION_DENIED);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(404, message, 'NOT_FOUND_ERROR');
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message) {
        super(409, message, 'CONFLICT_ERROR');
    }
}
exports.ConflictError = ConflictError;
function errorHandler(err, req, res, next) {
    if (err instanceof AppError) {
        logger_1.logger.warn({
            path: req.path,
            statusCode: err.statusCode,
            errorCode: err.errorCode,
            message: err.message
        }, `AppError: ${err.message}`);
        return (0, response_1.error)(res, err.statusCode, err.message, err.errorCode);
    }
    // Handle mongoose validation / cast errors
    if (err.name === 'ValidationError') {
        logger_1.logger.warn({ path: req.path, err: err.message }, 'Mongoose ValidationError');
        return (0, response_1.error)(res, 400, err.message, errors_1.ErrorCodes.VALIDATION_FAILED);
    }
    logger_1.logger.error({
        path: req.path,
        stack: err.stack,
        message: err.message
    }, 'Uncaught Internal Server Error');
    return (0, response_1.error)(res, 500, 'An unexpected error occurred on the server.', errors_1.ErrorCodes.INTERNAL_SERVER_ERROR);
}
