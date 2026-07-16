"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallSessionController = void 0;
const CallSession_1 = require("../models/CallSession");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const mongoose_1 = require("mongoose");
class CallSessionController {
    logCall = async (req, res, next) => {
        const userId = req.user.id;
        const { receiverId, callType, status, duration } = req.body;
        const start = Date.now();
        try {
            const callSession = await CallSession_1.CallSession.create({
                callerId: new mongoose_1.Types.ObjectId(userId),
                receiverId: new mongoose_1.Types.ObjectId(receiverId),
                status: status === 'completed' ? 'connected' : status === 'missed' ? 'missed' : 'rejected',
                startTime: new Date(Date.now() - (duration || 0) * 1000),
                endTime: new Date(),
            });
            (0, logger_1.logOperation)('LOG_CALL_SESSION', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Call session logged successfully.', callSession);
        }
        catch (err) {
            (0, logger_1.logOperation)('LOG_CALL_SESSION', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    getLogs = async (req, res, next) => {
        const userId = req.user.id;
        const start = Date.now();
        try {
            const logs = await CallSession_1.CallSession.find({
                $or: [
                    { callerId: new mongoose_1.Types.ObjectId(userId) },
                    { receiverId: new mongoose_1.Types.ObjectId(userId) }
                ]
            }).sort({ startTime: -1 });
            (0, logger_1.logOperation)('GET_CALL_SESSIONS_LOG', userId, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Call sessions retrieved successfully.', logs);
        }
        catch (err) {
            (0, logger_1.logOperation)('GET_CALL_SESSIONS_LOG', userId, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
}
exports.CallSessionController = CallSessionController;
