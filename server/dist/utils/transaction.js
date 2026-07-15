"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInTransaction = runInTransaction;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("./logger");
async function runInTransaction(callback) {
    const connection = mongoose_1.default.connection;
    // Start session
    let session = null;
    try {
        session = await connection.startSession();
    }
    catch (err) {
        logger_1.logger.warn('⚠️ Transactions not supported: Failed to start database session. Executing sequentially.');
        return await callback(null);
    }
    try {
        let result;
        // Attempt starting transaction block
        try {
            session.startTransaction();
            result = await callback(session);
            await session.commitTransaction();
        }
        catch (txErr) {
            // Check if error is due to standalone MongoDB deployment not supporting replica sets
            const isStandaloneErr = txErr.message?.includes('replica set') ||
                txErr.message?.includes('Transaction numbers') ||
                txErr.codeName === 'CommandNotSupported' ||
                txErr.code === 20; // CommandNotSupported code
            if (isStandaloneErr) {
                logger_1.logger.warn('⚠️ Standalone MongoDB deployment detected (no replica set). Falling back to sequential execution.');
                // Run callback without transaction control
                result = await callback(null);
            }
            else {
                // Real transaction abort on logic failure
                await session.abortTransaction();
                throw txErr;
            }
        }
        return result;
    }
    catch (err) {
        logger_1.logger.error(err, '❌ Database Transaction aborted due to exception:');
        throw err;
    }
    finally {
        session.endSession().catch((e) => logger_1.logger.debug(`Error ending DB session: ${e.message}`));
    }
}
