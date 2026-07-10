-- Migration 0011: Storage Buckets and Access Control Policies
-- Inserts required buckets and configures Row Level Security on storage objects.

-- Seed storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('workspace-icons', 'workspace-icons', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('attachments', 'attachments', false, 524288000, NULL),
  ('voice-notes', 'voice-notes', false, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-m4a']),
  ('temp-files', 'temp-files', false, 524288000, NULL)
ON CONFLICT (id) DO NOTHING;



-- 1. Avatars Policies
CREATE POLICY "avatars_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "avatars_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "avatars_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 2. Workspace Icons Policies
CREATE POLICY "workspace_icons_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'workspace-icons');

CREATE POLICY "workspace_icons_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'workspace-icons' AND
        EXISTS (
            -- Subdirectory is workspace_id: /workspace-icons/{workspace_id}/filename
            SELECT 1 FROM public.workspace_members AS wm
            JOIN public.workspace_roles AS wr ON wm.role_id = wr.id
            WHERE wm.workspace_id::text = (storage.foldername(name))[1] 
            AND wm.user_id = auth.uid() 
            AND wr.permissions @> ARRAY['manage_channels'] AND wm.deleted_at IS NULL
        )
    );

-- 3. Attachments Policies
CREATE POLICY "attachments_select" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'attachments' AND
        EXISTS (
            -- Subdirectory is message_id: /attachments/{message_id}/filename
            SELECT 1 FROM public.messages AS m
            WHERE m.id::text = (storage.foldername(name))[1]
            AND m.deleted_at IS NULL
            -- Message read permissions duplicated for storage level protection
            AND (
                (m.receiver_id IS NOT NULL AND auth.uid() IN (m.sender_id, m.receiver_id)) OR
                (m.channel_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM public.channels AS ch
                    JOIN public.workspace_members AS wm ON ch.workspace_id = wm.workspace_id
                    WHERE ch.id = m.channel_id AND wm.user_id = auth.uid() AND wm.deleted_at IS NULL
                    AND (ch.is_private = false OR EXISTS (
                        SELECT 1 FROM public.channel_members 
                        WHERE channel_id = ch.id AND user_id = auth.uid() AND deleted_at IS NULL
                    ))
                ))
            )
        )
    );

CREATE POLICY "attachments_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'attachments' AND
        EXISTS (
            -- Folder path matches message uploader details: /attachments/{message_id}/filename
            SELECT 1 FROM public.messages AS m
            WHERE m.id::text = (storage.foldername(name))[1] 
            AND m.sender_id = auth.uid() AND m.deleted_at IS NULL
        )
    );

-- 4. Voice Notes Policies
CREATE POLICY "voice_notes_select" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'voice-notes' AND
        EXISTS (
            SELECT 1 FROM public.messages AS m
            WHERE m.id::text = (storage.foldername(name))[1]
            AND m.deleted_at IS NULL
            AND (
                (m.receiver_id IS NOT NULL AND auth.uid() IN (m.sender_id, m.receiver_id)) OR
                (m.channel_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM public.channels AS ch
                    JOIN public.workspace_members AS wm ON ch.workspace_id = wm.workspace_id
                    WHERE ch.id = m.channel_id AND wm.user_id = auth.uid() AND wm.deleted_at IS NULL
                    AND (ch.is_private = false OR EXISTS (
                        SELECT 1 FROM public.channel_members 
                        WHERE channel_id = ch.id AND user_id = auth.uid() AND deleted_at IS NULL
                    ))
                ))
            )
        )
    );

CREATE POLICY "voice_notes_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'voice-notes' AND
        EXISTS (
            SELECT 1 FROM public.messages AS m
            WHERE m.id::text = (storage.foldername(name))[1] 
            AND m.sender_id = auth.uid() AND m.deleted_at IS NULL
        )
    );

-- 5. Temp Files Policies
CREATE POLICY "temp_files_all" ON storage.objects
    FOR ALL USING (
        bucket_id = 'temp-files' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );
