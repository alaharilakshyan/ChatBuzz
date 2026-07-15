import { User } from '../models/User';
import { Profile } from '../models/Profile';
import { Friendship } from '../models/Friendship';
import { FriendRequest } from '../models/FriendRequest';
import { Workspace } from '../models/Workspace';
import { Channel } from '../models/Channel';
import { AuditLog } from '../models/AuditLog';
import { logger } from '../utils/logger';

export async function runRollback(dryRun = true): Promise<void> {
  logger.info(`🧹 Starting migration rollback. Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}`);

  if (dryRun) {
    logger.info('✅ Dry-run rollback check complete. No database changes were applied.');
    return;
  }

  try {
    // Drop / wipe imported MongoDB collections
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Friendship.deleteMany({});
    await FriendRequest.deleteMany({});
    await Workspace.deleteMany({});
    await Channel.deleteMany({});
    await AuditLog.deleteMany({});

    logger.info('🧹 All migrated database collections cleared successfully.');
  } catch (err: any) {
    logger.error(err, '❌ Error performing database rollback:');
    throw err;
  }
}
