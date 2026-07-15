"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logOperation = logOperation;
const pino_1 = __importDefault(require("pino"));
const env_1 = require("../config/env");
exports.logger = (0, pino_1.default)({
    level: env_1.env.NODE_ENV === 'development' ? 'debug' : 'info',
    transport: env_1.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard'
        }
    } : undefined
});
function logOperation(operation, userId, requestId, status = 'SUCCESS', duration, error, metadata) {
    const logData = {
        operation,
        userId,
        requestId,
        status,
        durationMs: duration,
        error: error instanceof Error ? error.message : error,
        ...metadata
    };
    if (status === 'FAILED') {
        exports.logger.error(logData, `❌ Operation Failed: ${operation}`);
    }
    else {
        exports.logger.info(logData, `✅ Operation: ${operation}`);
    }
}
