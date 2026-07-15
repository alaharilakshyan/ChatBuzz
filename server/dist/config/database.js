"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
async function connectDatabase() {
    try {
        mongoose_1.default.connection.on('connected', () => {
            logger_1.logger.info('🔌 MongoDB connected successfully.');
        });
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.logger.error('❌ MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.logger.warn('🔌 MongoDB disconnected.');
        });
        await mongoose_1.default.connect(env_1.env.MONGODB_URI);
    }
    catch (err) {
        logger_1.logger.error(err, '❌ Failed to connect to MongoDB:');
        process.exit(1);
    }
}
async function disconnectDatabase() {
    await mongoose_1.default.disconnect();
}
