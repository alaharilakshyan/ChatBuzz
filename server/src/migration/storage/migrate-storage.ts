import { Profile } from '../../models/Profile';
import { Workspace } from '../../models/Workspace';
import { uploadMedia } from '../../storage/uploader';
import { logger } from '../../utils/logger';

export async function runStorageMigration(dryRun = true): Promise<void> {
  logger.info(`🚀 Starting Storage Asset migration. Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}`);

  // Fetch profiles with supabase avatars
  const profilesWithAvatars = await Profile.find({
    avatarUrl: { $regex: /supabase\.co/ }
  });

  const workspacesWithIcons = await Workspace.find({
    iconUrl: { $regex: /supabase\.co/ }
  });

  logger.info(`📥 Located Supabase assets:
    Profiles requiring Avatar migration: ${profilesWithAvatars.length}
    Workspaces requiring Icon migration: ${workspacesWithIcons.length}
  `);

  if (dryRun) {
    logger.info('✅ Dry-run validation complete. Storage records unmodified.');
    return;
  }

  // Migrate profile avatars
  for (const profile of profilesWithAvatars) {
    if (!profile.avatarUrl) continue;
    try {
      logger.info(`Migrating avatar for profile: ${profile.username}`);
      const res = await fetch(profile.avatarUrl);
      if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
      
      const buffer = Buffer.from(await res.arrayBuffer());
      const originalName = profile.avatarUrl.split('/').pop() || 'avatar.png';
      
      const uploadResult = await uploadMedia(
        buffer,
        originalName,
        res.headers.get('content-type') || 'image/png',
        'avatars'
      );

      profile.avatarUrl = uploadResult.url;
      await profile.save();
      logger.info(`Avatar migrated successfully -> ${uploadResult.url}`);
    } catch (err: any) {
      logger.error(err, `❌ Failed to migrate avatar for user ${profile.username}:`);
    }
  }

  // Migrate workspace icons
  for (const workspace of workspacesWithIcons) {
    if (!workspace.iconUrl) continue;
    try {
      logger.info(`Migrating icon for workspace: ${workspace.name}`);
      const res = await fetch(workspace.iconUrl);
      if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);

      const buffer = Buffer.from(await res.arrayBuffer());
      const originalName = workspace.iconUrl.split('/').pop() || 'icon.png';

      const uploadResult = await uploadMedia(
        buffer,
        originalName,
        res.headers.get('content-type') || 'image/png',
        'workspace-icons'
      );

      workspace.iconUrl = uploadResult.url;
      await workspace.save();
      logger.info(`Workspace icon migrated successfully -> ${uploadResult.url}`);
    } catch (err: any) {
      logger.error(err, `❌ Failed to migrate icon for workspace ${workspace.name}:`);
    }
  }

  logger.info('🎉 Storage migration processing completed.');
}
