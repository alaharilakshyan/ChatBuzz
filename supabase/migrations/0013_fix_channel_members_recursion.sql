-- Migration 0013: Fix Channel Members RLS Recursion & Update Storage Policies
-- Creates a SECURITY DEFINER function to bypass recursive RLS policies on channels.

CREATE OR REPLACE FUNCTION public.is_channel_member(ch_id UUID, u_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.channel_members
        WHERE channel_id = ch_id AND user_id = u_id AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Drop old recursive policy on channel_members
DROP POLICY IF EXISTS "channel_members_select_policy" ON public.channel_members;

-- Re-create channel_members policy using the helpers
CREATE POLICY "channel_members_select_policy" ON public.channel_members
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND deleted_at IS NULL AND (
            auth.uid() = user_id OR
            public.is_channel_member(channel_id, auth.uid()) OR
            -- For public channels, any workspace member can view channel members
            EXISTS (
                SELECT 1 FROM public.channels AS ch
                WHERE ch.id = channel_id AND public.is_workspace_member(ch.workspace_id, auth.uid()) AND ch.is_private = false
            )
        )
    );

-- Update storage policies in storage.objects to use non-recursive helpers
DROP POLICY IF EXISTS "workspace_icons_insert" ON storage.objects;
DROP POLICY IF EXISTS "attachments_select" ON storage.objects;
DROP POLICY IF EXISTS "attachments_insert" ON storage.objects;
DROP POLICY IF EXISTS "voice_notes_select" ON storage.objects;
DROP POLICY IF EXISTS "voice_notes_insert" ON storage.objects;

-- 1. Workspace Icons Insert
CREATE POLICY "workspace_icons_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'workspace-icons' AND
        EXISTS (
            -- Subdirectory is workspace_id: /workspace-icons/{workspace_id}/filename
            -- Check if user is workspace member with manage_channels permission
            SELECT 1 FROM public.workspace_members AS wm
            JOIN public.workspace_roles AS wr ON wm.role_id = wr.id
            WHERE wm.workspace_id::text = (storage.foldername(name))[1] 
            AND wm.user_id = auth.uid() 
            AND wr.permissions @> ARRAY['manage_channels'] AND wm.deleted_at IS NULL
        )
    );

-- 2. Attachments Select
CREATE POLICY "attachments_select" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'attachments' AND
        EXISTS (
            SELECT 1 FROM public.messages AS m
            WHERE m.id::text = (storage.foldername(name))[1]
            AND m.deleted_at IS NULL
            AND (
                (m.receiver_id IS NOT NULL AND auth.uid() IN (m.sender_id, m.receiver_id)) OR
                (m.channel_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM public.channels AS ch
                    WHERE ch.id = m.channel_id 
                    AND public.is_workspace_member(ch.workspace_id, auth.uid())
                    AND (ch.is_private = false OR public.is_channel_member(ch.id, auth.uid()))
                ))
            )
        )
    );

-- 3. Attachments Insert
CREATE POLICY "attachments_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'attachments' AND
        EXISTS (
            SELECT 1 FROM public.messages AS m
            WHERE m.id::text = (storage.foldername(name))[1] 
            AND m.sender_id = auth.uid() AND m.deleted_at IS NULL
        )
    );

-- 4. Voice Notes Select
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
                    WHERE ch.id = m.channel_id 
                    AND public.is_workspace_member(ch.workspace_id, auth.uid())
                    AND (ch.is_private = false OR public.is_channel_member(ch.id, auth.uid()))
                ))
            )
        )
    );

-- 5. Voice Notes Insert
CREATE POLICY "voice_notes_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'voice-notes' AND
        EXISTS (
            SELECT 1 FROM public.messages AS m
            WHERE m.id::text = (storage.foldername(name))[1] 
            AND m.sender_id = auth.uid() AND m.deleted_at IS NULL
        )
    );
