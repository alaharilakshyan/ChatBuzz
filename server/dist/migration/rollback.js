"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRollback = runRollback;
const User_1 = require("../models/User");
const Profile_1 = require("../models/Profile");
const Friendship_1 = require("../models/Friendship");
const FriendRequest_1 = require("../models/FriendRequest");
const Workspace_1 = require("../models/Workspace");
const Channel_1 = require("../models/Channel");
const AuditLog_1 = require("../models/AuditLog");
const logger_1 = require("../utils/logger");
async function runRollback(dryRun = true) {
    logger_1.logger.info(`🧹 Starting migration rollback. Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}`);
    if (dryRun) {
        logger_1.logger.info('✅ Dry-run rollback check complete. No database changes were applied.');
        return;
    }
    try {
        // Drop / wipe imported MongoDB collections
        await User_1.User.deleteMany({});
        await Profile_1.Profile.deleteMany({});
        await Friendship_1.Friendship.deleteMany({});
        await FriendRequest_1.FriendRequest.deleteMany({});
        await Workspace_1.Workspace.deleteMany({});
        await Channel_1.Channel.deleteMany({});
        await AuditLog_1.AuditLog.deleteMany({});
        logger_1.logger.info('🧹 All migrated database collections cleared successfully.');
    }
    catch (err) {
        logger_1.logger.error(err, '❌ Error performing database rollback:');
        throw err;
    }
}
