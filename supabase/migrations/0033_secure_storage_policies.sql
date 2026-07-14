-- Migration 0033: Secure Storage Policies
-- Audits and cleans up loose policies on storage.objects. Replaces them with granular, owner/friendship validated gates.

-- Clean up any loose existing policies to ensure no security gaps remain
DROP POLICY IF EXISTS "backgrounds_select" ON storage.objects;
DROP POLICY IF EXISTS "backgrounds_insert" ON storage.objects;
DROP POLICY IF EXISTS "backgrounds_update" ON storage.objects;
DROP POLICY IF EXISTS "backgrounds_delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update/delete their own backgrounds" ON storage.objects;

DROP POLICY IF EXISTS "echoes_select" ON storage.objects;
DROP POLICY IF EXISTS "echoes_insert" ON storage.objects;
DROP POLICY IF EXISTS "echoes_update" ON storage.objects;
DROP POLICY IF EXISTS "echoes_delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to echoes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from echoes" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update/delete their own echoes" ON storage.objects;

DROP POLICY IF EXISTS "attachments_select" ON storage.objects;
DROP POLICY IF EXISTS "attachments_insert" ON storage.objects;

DROP POLICY IF EXISTS "voice_notes_select" ON storage.objects;
DROP POLICY IF EXISTS "voice_notes_insert" ON storage.objects;

DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete" ON storage.objects;

DROP POLICY IF EXISTS "banners_select" ON storage.objects;
DROP POLICY IF EXISTS "banners_insert" ON storage.objects;
DROP POLICY IF EXISTS "banners_update" ON storage.objects;
DROP POLICY IF EXISTS "banners_delete" ON storage.objects;

DROP POLICY IF EXISTS "branding_select" ON storage.objects;
DROP POLICY IF EXISTS "temp_files_all" ON storage.objects;


-- =========================================================================
-- 1. Avatars Bucket Policies
-- =========================================================================
CREATE POLICY "avatars_select" ON storage.objects 
    FOR SELECT TO public USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert" ON storage.objects 
    FOR INSERT TO authenticated 
    WITH CHECK (
        bucket_id = 'avatars' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "avatars_update" ON storage.objects 
    FOR UPDATE TO authenticated 
    USING (
        bucket_id = 'avatars' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "avatars_delete" ON storage.objects 
    FOR DELETE TO authenticated 
    USING (
        bucket_id = 'avatars' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );


-- =========================================================================
-- 2. Banners Bucket Policies
-- =========================================================================
CREATE POLICY "banners_select" ON storage.objects 
    FOR SELECT TO public USING (bucket_id = 'banners');

CREATE POLICY "banners_insert" ON storage.objects 
    FOR INSERT TO authenticated 
    WITH CHECK (
        bucket_id = 'banners' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "banners_update" ON storage.objects 
    FOR UPDATE TO authenticated 
    USING (
        bucket_id = 'banners' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "banners_delete" ON storage.objects 
    FOR DELETE TO authenticated 
    USING (
        bucket_id = 'banners' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );


-- =========================================================================
-- 3. Backgrounds Bucket Policies (File names prefixed with user ID: user_id-timestamp-file)
-- =========================================================================
CREATE POLICY "backgrounds_select" ON storage.objects 
    FOR SELECT TO public USING (bucket_id = 'backgrounds');

CREATE POLICY "backgrounds_insert" ON storage.objects 
    FOR INSERT TO authenticated 
    WITH CHECK (
        bucket_id = 'backgrounds' AND 
        split_part(name, '-', 1) = auth.uid()::text
    );

CREATE POLICY "backgrounds_update" ON storage.objects 
    FOR UPDATE TO authenticated 
    USING (
        bucket_id = 'backgrounds' AND 
        split_part(name, '-', 1) = auth.uid()::text
    );

CREATE POLICY "backgrounds_delete" ON storage.objects 
    FOR DELETE TO authenticated 
    USING (
        bucket_id = 'backgrounds' AND 
        split_part(name, '-', 1) = auth.uid()::text
    );


-- =========================================================================
-- 4. Echoes (Stories) Bucket Policies (File names prefixed with user ID: user_id-timestamp-file)
-- =========================================================================
CREATE POLICY "echoes_select" ON storage.objects 
    FOR SELECT TO authenticated 
    USING (
        bucket_id = 'echoes' AND (
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
    FOR INSERT TO authenticated 
    WITH CHECK (
        bucket_id = 'echoes' AND 
        split_part(name, '-', 1) = auth.uid()::text
    );

CREATE POLICY "echoes_delete" ON storage.objects 
    FOR DELETE TO authenticated 
    USING (
        bucket_id = 'echoes' AND 
        split_part(name, '-', 1) = auth.uid()::text
    );


-- =========================================================================
-- 5. Attachments Bucket Policies (Folder name matches channel_id or friend_profile_id)
-- =========================================================================
CREATE POLICY "attachments_select" ON storage.objects 
    FOR SELECT TO authenticated 
    USING (
        bucket_id = 'attachments' AND (
            -- If it's a channel conversation: check if the user is a workspace member
            EXISTS (
                SELECT 1 FROM public.channels AS ch
                WHERE ch.id::text = (storage.foldername(name))[1]
                AND public.is_workspace_member(ch.workspace_id, auth.uid())
                AND (ch.is_private = false OR public.is_channel_member(ch.id, auth.uid()))
            )
            OR
            -- If it's a direct message (profile ID): check if the user is self or friend
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
    FOR INSERT TO authenticated 
    WITH CHECK (
        bucket_id = 'attachments' AND (
            -- Channel membership check
            EXISTS (
                SELECT 1 FROM public.channels AS ch
                WHERE ch.id::text = (storage.foldername(name))[1]
                AND public.is_workspace_member(ch.workspace_id, auth.uid())
                AND (ch.is_private = false OR public.is_channel_member(ch.id, auth.uid()))
            )
            OR
            -- Self or active friend check
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


-- =========================================================================
-- 6. Voice Notes Bucket Policies (Folder name matches channel_id or friend_profile_id)
-- =========================================================================
CREATE POLICY "voice_notes_select" ON storage.objects 
    FOR SELECT TO authenticated 
    USING (
        bucket_id = 'voice-notes' AND (
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

CREATE POLICY "voice_notes_insert" ON storage.objects 
    FOR INSERT TO authenticated 
    WITH CHECK (
        bucket_id = 'voice-notes' AND (
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


-- =========================================================================
-- 7. System & Temp Buckets
-- =========================================================================
CREATE POLICY "branding_select" ON storage.objects 
    FOR SELECT TO public USING (bucket_id = 'branding');

CREATE POLICY "temp_files_all" ON storage.objects 
    FOR ALL TO authenticated 
    USING (
        bucket_id = 'temp-files' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );
