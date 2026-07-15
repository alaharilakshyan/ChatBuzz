"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const migrate_db_1 = require("../migration/database/migrate-db");
const migrate_storage_1 = require("../migration/storage/migrate-storage");
const rollback_1 = require("../migration/rollback");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
class AdminController {
    migrate = async (req, res, next) => {
        const dryRun = req.query.dryRun !== 'false';
        const start = Date.now();
        try {
            await (0, migrate_db_1.runDatabaseMigration)(dryRun);
            await (0, migrate_storage_1.runStorageMigration)(dryRun);
            (0, logger_1.logOperation)('RUN_ADMIN_MIGRATION', undefined, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Migration completed successfully.', { mode: dryRun ? 'dry-run' : 'live' });
        }
        catch (err) {
            (0, logger_1.logOperation)('RUN_ADMIN_MIGRATION', undefined, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    rollback = async (req, res, next) => {
        const dryRun = req.query.dryRun !== 'false';
        const start = Date.now();
        try {
            await (0, rollback_1.runRollback)(dryRun);
            (0, logger_1.logOperation)('RUN_ADMIN_ROLLBACK', undefined, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Rollback completed successfully.', { mode: dryRun ? 'dry-run' : 'live' });
        }
        catch (err) {
            (0, logger_1.logOperation)('RUN_ADMIN_ROLLBACK', undefined, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
}
exports.AdminController = AdminController;
