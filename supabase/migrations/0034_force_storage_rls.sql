-- Migration 0034: Force Storage RLS & Audited Policies
-- Drops insecure or buggy policies and replacing them with secure ones. RLS is already enabled by default on storage tables.

-- 1. Clean up existing policies on storage.objects to avoid conflicts/drifts
DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete" ON storage.objects;

DROP POLICY IF EXISTS "banners_select" ON storage.objects;
DROP POLICY IF EXISTS "banners_insert" ON storage.objects;
DROP POLICY IF EXISTS "banners_update" ON storage.objects;
DROP POLICY IF EXISTS "banners_delete" ON storage.objects;

DROP POLICY IF EXISTS "backgrounds_select" ON storage.objects;
DROP POLICY IF EXISTS "backgrounds_insert" ON storage.objects;
DROP POLICY IF EXISTS "backgrounds_update" ON storage.objects;
DROP POLICY IF EXISTS "backgrounds_delete" ON storage.objects;

DROP POLICY IF EXISTS "echoes_select" ON storage.objects;
DROP POLICY IF EXISTS "echoes_insert" ON storage.objects;
DROP POLICY IF EXISTS "echoes_update" ON storage.objects;
DROP POLICY IF EXISTS "echoes_delete" ON storage.objects;

DROP POLICY IF EXISTS "attachments_select" ON storage.objects;
DROP POLICY IF EXISTS "attachments_insert" ON storage.objects;
DROP POLICY IF EXISTS "attachments_update" ON storage.objects;
DROP POLICY IF EXISTS "attachments_delete" ON storage.objects;

DROP POLICY IF EXISTS "voice_notes_select" ON storage.objects;
DROP POLICY IF EXISTS "voice_notes_insert" ON storage.objects;
DROP POLICY IF EXISTS "voice_notes_update" ON storage.objects;
DROP POLICY IF EXISTS "voice_notes_delete" ON storage.objects;

DROP POLICY IF EXISTS "branding_select" ON storage.objects;
DROP POLICY IF EXISTS "temp_files_all" ON storage.objects;
DROP POLICY IF EXISTS "temp_allow_all_inserts 1oj01fe_0" ON storage.objects;

-- 2. Re-create audited policies for each bucket

-- ==========================================
-- A. Avatars Bucket (Public Read, Owner Write)
-- ==========================================
CREATE POLICY "avatars_select" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "avatars_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "avatars_update" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "avatars_delete" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- ==========================================
-- B. Banners Bucket (Public Read, Owner Write)
-- ==========================================
CREATE POLICY "banners_select" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'banners' AND auth.uid() IS NOT NULL);

CREATE POLICY "banners_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'banners' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "banners_update" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'banners' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "banners_delete" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'banners' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- ==========================================
-- C. Backgrounds Bucket (Public Read, Owner Write)
-- ==========================================
CREATE POLICY "backgrounds_select" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'backgrounds' AND auth.uid() IS NOT NULL);

CREATE POLICY "backgrounds_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'backgrounds' AND
        split_part(name, '-', 1) = auth.uid()::text
    );

CREATE POLICY "backgrounds_update" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'backgrounds' AND
        split_part(name, '-', 1) = auth.uid()::text
    );

CREATE POLICY "backgrounds_delete" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'backgrounds' AND
        split_part(name, '-', 1) = auth.uid()::text
    );

-- ==========================================
-- D. Echoes Bucket (Friend/Owner Read, Owner Write)
-- ==========================================
CREATE POLICY "echoes_select" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'echoes' AND auth.uid() IS NOT NULL AND (
            split_part(name, '-', 1) = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM public.friendships
                WHERE (
                    (user1_id = auth.uid() AND user2_id::text = split_part(name, '-', 1)) OR
                    (user2_id = auth.uid() AND user1_id::text = split_part(name, '-', 1))
                ) AND deleted_at IS NULL
            )
        )
    );

CREATE POLICY "echoes_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'echoes' AND
        split_part(name, '-', 1) = auth.uid()::text
    );

CREATE POLICY "echoes_update" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'echoes' AND
        split_part(name, '-', 1) = auth.uid()::text
    );

CREATE POLICY "echoes_delete" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'echoes' AND
        split_part(name, '-', 1) = auth.uid()::text
    );

-- ==========================================
-- E. Attachments Bucket (Channel Member/DM Friend Read, Owner Write)
-- ==========================================
CREATE POLICY "attachments_select" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'attachments' AND auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.channels AS ch
                WHERE ch.id::text = (storage.foldername(name))[1]
                AND public.is_workspace_member(ch.workspace_id, auth.uid())
                AND (ch.is_private = false OR public.is_channel_member(ch.id, auth.uid()))
            )
            OR
            EXISTS (
                SELECT 1 FROM public.profiles AS p
                WHERE p.id::text = (storage.foldername(name))[1]
                AND (
                    p.id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.friendships
                        WHERE (
                            (user1_id = auth.uid() AND user2_id = p.id) OR
                            (user2_id = auth.uid() AND user1_id = p.id)
                        ) AND deleted_at IS NULL
                    )
                )
            )
        )
    );

CREATE POLICY "attachments_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'attachments' AND auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.channels AS ch
                WHERE ch.id::text = (storage.foldername(name))[1]
                AND public.is_workspace_member(ch.workspace_id, auth.uid())
                AND (ch.is_private = false OR public.is_channel_member(ch.id, auth.uid()))
            )
            OR
            EXISTS (
                SELECT 1 FROM public.profiles AS p
                WHERE p.id::text = (storage.foldername(name))[1]
                AND (
                    p.id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.friendships
                        WHERE (
                            (user1_id = auth.uid() AND user2_id = p.id) OR
                            (user2_id = auth.uid() AND user1_id = p.id)
                        ) AND deleted_at IS NULL
                    )
                )
            )
        )
    );

CREATE POLICY "attachments_update" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'attachments' AND auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.channels AS ch
                WHERE ch.id::text = (storage.foldername(name))[1]
                AND public.is_workspace_member(ch.workspace_id, auth.uid())
                AND (ch.is_private = false OR public.is_channel_member(ch.id, auth.uid()))
            )
            OR
            EXISTS (
                SELECT 1 FROM public.profiles AS p
                WHERE p.id::text = (storage.foldername(name))[1]
                AND (
                    p.id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.friendships
                        WHERE (
                            (user1_id = auth.uid() AND user2_id = p.id) OR
                            (user2_id = auth.uid() AND user1_id = p.id)
                        ) AND deleted_at IS NULL
                    )
                )
            )
        )
    );

CREATE POLICY "attachments_delete" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'attachments' AND auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.channels AS ch
                WHERE ch.id::text = (storage.foldername(name))[1]
                AND public.is_workspace_member(ch.workspace_id, auth.uid())
                AND (ch.is_private = false OR public.is_channel_member(ch.id, auth.uid()))
            )
            OR
            EXISTS (
                SELECT 1 FROM public.profiles AS p
                WHERE p.id::text = (storage.foldername(name))[1]
                AND (
                    p.id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.friendships
                        WHERE (
                            (user1_id = auth.uid() AND user2_id = p.id) OR
                            (user2_id = auth.uid() AND user1_id = p.id)
                        ) AND deleted_at IS NULL
                    )
                )
            )
        )
    );

-- ==========================================
-- F. Buckets Metadata Table SELECT Access
-- ==========================================
DROP POLICY IF EXISTS "Allow authenticated read to storage buckets" ON storage.buckets;
CREATE POLICY "Allow authenticated read to storage buckets" ON storage.buckets
    FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
