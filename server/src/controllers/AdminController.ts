import { Request, Response, NextFunction } from 'express';
import { runDatabaseMigration } from '../migration/database/migrate-db';
import { runStorageMigration } from '../migration/storage/migrate-storage';
import { runRollback } from '../migration/rollback';
import { logOperation } from '../utils/logger';
import { success } from '../utils/response';

export class AdminController {
  migrate = async (req: Request, res: Response, next: NextFunction) => {
    const dryRun = req.query.dryRun !== 'false';
    const start = Date.now();

    try {
      await runDatabaseMigration(dryRun);
      await runStorageMigration(dryRun);
      logOperation('RUN_ADMIN_MIGRATION', undefined, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Migration completed successfully.', { mode: dryRun ? 'dry-run' : 'live' });
    } catch (err) {
      logOperation('RUN_ADMIN_MIGRATION', undefined, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  rollback = async (req: Request, res: Response, next: NextFunction) => {
    const dryRun = req.query.dryRun !== 'false';
    const start = Date.now();

    try {
      await runRollback(dryRun);
      logOperation('RUN_ADMIN_ROLLBACK', undefined, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Rollback completed successfully.', { mode: dryRun ? 'dry-run' : 'live' });
    } catch (err) {
      logOperation('RUN_ADMIN_ROLLBACK', undefined, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };
}
