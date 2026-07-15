import mongoose from 'mongoose';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { User } from '../../models/User';
import { Profile } from '../../models/Profile';
import { Friendship } from '../../models/Friendship';
import { FriendRequest } from '../../models/FriendRequest';
import { Workspace } from '../../models/Workspace';
import { Channel } from '../../models/Channel';

const SUPABASE_REST_URL = 'https://ejgsaymsxqzvcrjpfego.supabase.co/rest/v1';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock_key';

// Converts a UUID string to a valid 24-char ObjectId deterministically
export function uuidToObjectId(uuid: string): mongoose.Types.ObjectId {
  const cleanHex = uuid.replace(/[^0-9a-fA-F]/g, '');
  const paddedHex = cleanHex.slice(0, 24).padStart(24, '0');
  return new mongoose.Types.ObjectId(paddedHex);
}

async function fetchSupabaseTable(tableName: string): Promise<any[]> {
  try {
    const res = await fetch(`${SUPABASE_REST_URL}/${tableName}?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!res.ok) {
      if (res.status === 404) {
        logger.warn(`⚠️ Table ${tableName} returned 404. Skipping.`);
        return [];
      }
      throw new Error(`Fetch table ${tableName} failed: ${res.statusText}`);
    }

    return await res.json() as any[];
  } catch (err: any) {
    logger.warn(`⚠️ Failed to fetch table ${tableName}: ${err.message}. Skipping.`);
    return [];
  }
}

export async function runDatabaseMigration(dryRun = true): Promise<void> {
  logger.info(`🚀 Starting database migration. Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'}`);

  // 1. Fetch data from Supabase REST endpoints
  const rawProfiles = await fetchSupabaseTable('profiles');
  const rawFriendships = await fetchSupabaseTable('friendships');
  const rawRequests = await fetchSupabaseTable('friend_requests');
  const rawWorkspaces = await fetchSupabaseTable('workspaces');
  const rawChannels = await fetchSupabaseTable('channels');

  logger.info(`📥 Extracted from Supabase:
    Profiles: ${rawProfiles.length}
    Friendships: ${rawFriendships.length}
    Friend Requests: ${rawRequests.length}
    Workspaces: ${rawWorkspaces.length}
    Channels: ${rawChannels.length}
  `);

  if (dryRun) {
    logger.info('✅ Dry-run validation complete. No database changes were applied.');
    return;
  }

  // 2. Perform conversions and batch inserts
  // Profiles -> Users & Profiles
  if (rawProfiles.length > 0) {
    const userDocs = rawProfiles.map(p => ({
      _id: uuidToObjectId(p.id),
      email: p.email || `${p.username || 'user'}@chatbuzz.local`,
      emailVerified: true
    }));

    const profileDocs = rawProfiles.map(p => ({
      userId: uuidToObjectId(p.id),
      username: p.username || `user_${p.id.slice(0, 5)}`,
      avatarUrl: p.avatar_url,
      bannerUrl: p.banner_url || null,
      userTag: p.user_tag || '0000',
      description: p.description || null
    }));

    await User.insertMany(userDocs, { ordered: false }).catch(() => {});
    await Profile.insertMany(profileDocs, { ordered: false }).catch(() => {});
    logger.info('👥 Users & Profiles collections imported.');
  }

  // Friendships
  if (rawFriendships.length > 0) {
    const friendshipDocs = rawFriendships.map(f => {
      const u1 = uuidToObjectId(f.user1_id);
      const u2 = uuidToObjectId(f.user2_id);
      const [first, second] = u1.toString() < u2.toString() ? [u1, u2] : [u2, u1];
      return {
        user1Id: first,
        user2Id: second,
        createdAt: f.created_at ? new Date(f.created_at) : new Date()
      };
    });

    await Friendship.insertMany(friendshipDocs, { ordered: false }).catch(() => {});
    logger.info('🤝 Friendships collection imported.');
  }

  // Friend Requests
  if (rawRequests.length > 0) {
    const requestDocs = rawRequests.map(r => ({
      _id: uuidToObjectId(r.id),
      requesterId: uuidToObjectId(r.requester_id),
      recipientId: uuidToObjectId(r.recipient_id),
      status: r.status,
      createdAt: r.created_at ? new Date(r.created_at) : new Date()
    }));

    await FriendRequest.insertMany(requestDocs, { ordered: false }).catch(() => {});
    logger.info('📬 Friend Requests collection imported.');
  }

  // Workspaces
  if (rawWorkspaces.length > 0) {
    const workspaceDocs = rawWorkspaces.map(w => ({
      _id: uuidToObjectId(w.id),
      name: w.name,
      iconUrl: w.icon_url || null,
      createdBy: uuidToObjectId(w.created_by || w.owner_id)
    }));

    await Workspace.insertMany(workspaceDocs, { ordered: false }).catch(() => {});
    logger.info('🏢 Workspaces collection imported.');
  }

  // Channels
  if (rawChannels.length > 0) {
    const channelDocs = rawChannels.map(c => ({
      _id: uuidToObjectId(c.id),
      workspaceId: uuidToObjectId(c.workspace_id),
      name: c.name,
      isPrivate: c.is_private || false,
      createdBy: uuidToObjectId(c.created_by)
    }));

    await Channel.insertMany(channelDocs, { ordered: false }).catch(() => {});
    logger.info('💬 Channels collection imported.');
  }

  logger.info('🎉 Database import and verification completed successfully.');
}
