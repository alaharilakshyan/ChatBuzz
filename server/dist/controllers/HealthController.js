"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const response_1 = require("../utils/response");
const uploader_1 = require("../storage/uploader");
const os_1 = __importDefault(require("os"));
class HealthController {
    check = async (req, res) => {
        const dbStatus = mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected';
        const uptime = process.uptime();
        const freeMem = os_1.default.freemem();
        const totalMem = os_1.default.totalmem();
        const isHealthy = dbStatus === 'connected';
        const healthData = {
            status: isHealthy ? 'healthy' : 'unhealthy',
            uptime,
            environment: env_1.env.NODE_ENV,
            services: {
                database: dbStatus,
                storage: uploader_1.isCloudinaryMock ? 'local_fallback' : 'cloudinary',
                auth: env_1.env.AUTH_PROVIDER
            },
            system: {
                freeMemory: `${Math.round(freeMem / 1024 / 1024)}MB`,
                totalMemory: `${Math.round(totalMem / 1024 / 1024)}MB`,
                cpuLoad: os_1.default.loadavg()
            }
        };
        if (isHealthy) {
            return (0, response_1.success)(res, 'System health report retrieved.', healthData);
        }
        else {
            return res.status(503).json({
                success: false,
                error: 'Database service is unreachable.',
                errorCode: 'HEALTH_CHECK_FAILED',
                timestamp: new Date().toISOString()
            });
        }
    };
    live = (req, res) => {
        return (0, response_1.success)(res, 'Server is running.', null);
    };
    ready = (req, res) => {
        const isReady = mongoose_1.default.connection.readyState === 1;
        if (isReady) {
            return (0, response_1.success)(res, 'Server is ready.', null);
        }
        else {
            return res.status(503).json({
                success: false,
                error: 'Server is not ready to receive connections.',
                errorCode: 'READY_CHECK_FAILED',
                timestamp: new Date().toISOString()
            });
        }
    };
}
exports.HealthController = HealthController;
