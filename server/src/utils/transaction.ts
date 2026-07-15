import mongoose from 'mongoose';
import { logger } from './logger';

export async function runInTransaction<T>(
  callback: (session: mongoose.ClientSession | null) => Promise<T>
): Promise<T> {
  const connection = mongoose.connection;
  
  // Start session
  let session: mongoose.ClientSession | null = null;
  try {
    session = await connection.startSession();
  } catch (err) {
    logger.warn('⚠️ Transactions not supported: Failed to start database session. Executing sequentially.');
    return await callback(null);
  }

  try {
    let result: T;
    
    // Attempt starting transaction block
    try {
      session.startTransaction();
      result = await callback(session);
      await session.commitTransaction();
    } catch (txErr: any) {
      // Check if error is due to standalone MongoDB deployment not supporting replica sets
      const isStandaloneErr = 
        txErr.message?.includes('replica set') || 
        txErr.message?.includes('Transaction numbers') ||
        txErr.codeName === 'CommandNotSupported' ||
        txErr.code === 20; // CommandNotSupported code

      if (isStandaloneErr) {
        logger.warn('⚠️ Standalone MongoDB deployment detected (no replica set). Falling back to sequential execution.');
        // Run callback without transaction control
        result = await callback(null);
      } else {
        // Real transaction abort on logic failure
        await session.abortTransaction();
        throw txErr;
      }
    }
    
    return result;
  } catch (err) {
    logger.error(err, '❌ Database Transaction aborted due to exception:');
    throw err;
  } finally {
    session.endSession().catch((e) => logger.debug(`Error ending DB session: ${e.message}`));
  }
}
