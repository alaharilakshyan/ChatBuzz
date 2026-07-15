-- Migration 0039: Storage Policies Fix
-- Re-creates storage buckets and objects policies to qualify table references, 
-- fix UUID prefix extraction logic, restore missing policies, and allow public reads on buckets.

-- 1. Buckets SELECT policy: allow public read so that anon/authenticated roles can access bucket metadata.
DROP POLICY IF EXISTS "Allow authenticated read to storage buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Allow public read to storage buckets" ON storage.buckets;
CREATE POLICY "Allow public read to storage buckets" ON storage.buckets
    FOR SELECT TO public USING (true);

-- 2. Drop existing problematic or incomplete policies to rebuild them cleanly
DROP POLICY IF EXISTS "workspace_icons_insert" ON storage.objects;
DROP POLICY IF EXISTS "workspace_icons_select" ON storage.objects;

DROP POLICY IF EXISTS "backgrounds_select" ON storage.objects;
DROP POLICY IF EXISTS "backgrounds_insert" ON storage.objects;
DROP POLICY IF EXISTS "backgrounds_update" ON storage.objects;
DROP POLICY IF EXISTS "backgrounds_delete" ON storage.objects;

DROP POLICY IF EXISTS "echoes_select" ON storage.objects;
DROP POLICY IF EXISTS "echoes_insert" ON storage.objects;
DROP POLICY IF EXISTS "echoes_update" ON storage.objects;
DROP POLICY IF EXISTS "echoes_delete" ON storage.objects;

DROP POLICY IF EXISTS "voice_notes_select" ON storage.objects;
DROP POLICY IF EXISTS "voice_notes_insert" ON storage.objects;
DROP POLICY IF EXISTS "voice_notes_update" ON storage.objects;
DROP POLICY IF EXISTS "voice_notes_delete" ON storage.objects;

DROP POLICY IF EXISTS "temp_files_all" ON storage.objects;
DROP POLICY IF EXISTS "branding_select" ON storage.objects;

-- 3. Create fixed Workspace Icons policies (Qualify name to prevent shadowing)
CREATE POLICY "workspace_icons_select" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'workspace-icons' AND auth.uid() IS NOT NULL);

CREATE POLICY "workspace_icons_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'workspace-icons' AND
        EXISTS (
            SELECT 1 FROM public.workspace_members AS wm
            JOIN public.workspace_roles AS wr ON wm.role_id = wr.id
            WHERE wm.workspace_id::text = (storage.foldername(storage.objects.name))[1] 
            AND wm.user_id = auth.uid() 
            AND wr.permissions @> ARRAY['manage_channels'] 
            AND wm.deleted_at IS NULL
        )
    );

-- 4. Create fixed Backgrounds policies (Use starts_with to handle UUIDs with dashes correctly)
CREATE POLICY "backgrounds_select" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'backgrounds' AND auth.uid() IS NOT NULL);

CREATE POLICY "backgrounds_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'backgrounds' AND
        starts_with(storage.objects.name, auth.uid()::text || '-')
    );

CREATE POLICY "backgrounds_update" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'backgrounds' AND
        starts_with(storage.objects.name, auth.uid()::text || '-')
    );

CREATE POLICY "backgrounds_delete" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'backgrounds' AND
        starts_with(storage.objects.name, auth.uid()::text || '-')
    );

-- 5. Create fixed Echoes policies (Use starts_with to handle UUIDs with dashes correctly)
CREATE POLICY "echoes_select" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'echoes' AND auth.uid() IS NOT NULL AND (
            starts_with(storage.objects.name, auth.uid()::text || '-') OR
            EXISTS (
                SELECT 1 FROM public.friendships
                WHERE (
                    (user1_id = auth.uid() AND starts_with(storage.objects.name, user2_id::text || '-')) OR
                    (user2_id = auth.uid() AND starts_with(storage.objects.name, user1_id::text || '-'))
                ) AND friendships.deleted_at IS NULL
            )
        )
    );

CREATE POLICY "echoes_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'echoes' AND
        starts_with(storage.objects.name, auth.uid()::text || '-')
    );

CREATE POLICY "echoes_update" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'echoes' AND
        starts_with(storage.objects.name, auth.uid()::text || '-')
    );

CREATE POLICY "echoes_delete" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'echoes' AND
        starts_with(storage.objects.name, auth.uid()::text || '-')
    );

-- 6. Restore qualified Voice Notes policies
CREATE POLICY "voice_notes_select" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'voice-notes' AND auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.channels AS ch
                WHERE ch.id::text = (storage.foldername(storage.objects.name))[1]
                AND public.is_workspace_member(ch.workspace_id, auth.uid())
                AND (ch.is_private = false OR public.is_channel_member(ch.id, auth.uid()))
            )
            OR
            EXISTS (
                SELECT 1 FROM public.profiles AS p
                WHERE p.id::text = (storage.foldername(storage.objects.name))[1]
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
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'voice-notes' AND auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.channels AS ch
                WHERE ch.id::text = (storage.foldername(storage.objects.name))[1]
                AND public.is_workspace_member(ch.workspace_id, auth.uid())
                AND (ch.is_private = false OR public.is_channel_member(ch.id, auth.uid()))
            )
            OR
            EXISTS (
                SELECT 1 FROM public.profiles AS p
                WHERE p.id::text = (storage.foldername(storage.objects.name))[1]
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

CREATE POLICY "voice_notes_update" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'voice-notes' AND auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.channels AS ch
                WHERE ch.id::text = (storage.foldername(storage.objects.name))[1]
                AND public.is_workspace_member(ch.workspace_id, auth.uid())
                AND (ch.is_private = false OR public.is_channel_member(ch.id, auth.uid()))
            )
            OR
            EXISTS (
                SELECT 1 FROM public.profiles AS p
                WHERE p.id::text = (storage.foldername(storage.objects.name))[1]
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

CREATE POLICY "voice_notes_delete" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'voice-notes' AND auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.channels AS ch
                WHERE ch.id::text = (storage.foldername(storage.objects.name))[1]
                AND public.is_workspace_member(ch.workspace_id, auth.uid())
                AND (ch.is_private = false OR public.is_channel_member(ch.id, auth.uid()))
            )
            OR
            EXISTS (
                SELECT 1 FROM public.profiles AS p
                WHERE p.id::text = (storage.foldername(storage.objects.name))[1]
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

-- 7. Restore missing Temp Files and Branding policies
CREATE POLICY "temp_files_all" ON storage.objects
    FOR ALL TO authenticated USING (
        bucket_id = 'temp-files' AND 
        (storage.foldername(storage.objects.name))[1] = auth.uid()::text
    );

CREATE POLICY "branding_select" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'branding');
