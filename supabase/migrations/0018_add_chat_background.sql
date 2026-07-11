-- Migration 0018: Add chat_background_url to user_settings, backgrounds bucket, and atomic workspace creation RPC
-- Expands settings schema and provides transaction guarantees for workspace setup.

ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS chat_background_url TEXT;

-- Seed backgrounds bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('backgrounds', 'backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Public SELECT policy for backgrounds bucket
DROP POLICY IF EXISTS "backgrounds_select" ON storage.objects;
CREATE POLICY "backgrounds_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'backgrounds');

-- Insert policy for authenticated users inside their own user path
DROP POLICY IF EXISTS "backgrounds_insert" ON storage.objects;
CREATE POLICY "backgrounds_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'backgrounds' AND 
        (name LIKE (auth.uid()::text || '/%'))
    );

-- Update policy for authenticated users inside their own user path
DROP POLICY IF EXISTS "backgrounds_update" ON storage.objects;
CREATE POLICY "backgrounds_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'backgrounds' AND 
        (name LIKE (auth.uid()::text || '/%'))
    );

-- Delete policy for authenticated users inside their own user path
DROP POLICY IF EXISTS "backgrounds_delete" ON storage.objects;
CREATE POLICY "backgrounds_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'backgrounds' AND 
        (name LIKE (auth.uid()::text || '/%'))
    );

-- Atomic Workspace/Group Creation function
CREATE OR REPLACE FUNCTION public.create_workspace(workspace_name TEXT)
RETURNS UUID AS $$
DECLARE
    new_ws_id UUID;
    owner_role_id UUID;
    member_role_id UUID;
    slug_val TEXT;
    rand_suffix TEXT;
BEGIN
    -- Check caller is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Generate unique slug
    slug_val := lower(regexp_replace(workspace_name, '[^a-zA-Z0-9]+', '-', 'g'));
    rand_suffix := substring(md5(random()::text) from 1 for 6);
    slug_val := slug_val || '-' || rand_suffix;

    -- 1. Insert Workspace
    INSERT INTO public.workspaces (name, slug, owner_id, created_by)
    VALUES (workspace_name, slug_val, auth.uid(), auth.uid())
    RETURNING id INTO new_ws_id;

    -- 2. Insert Default Roles for this Workspace
    INSERT INTO public.workspace_roles (workspace_id, name, permissions, created_by)
    VALUES 
        (new_ws_id, 'owner', ARRAY['manage_roles', 'invite_users', 'manage_members', 'create_channels'], auth.uid())
    RETURNING id INTO owner_role_id;

    INSERT INTO public.workspace_roles (workspace_id, name, permissions, created_by)
    VALUES 
        (new_ws_id, 'member', ARRAY['send_messages'], auth.uid())
    RETURNING id INTO member_role_id;

    -- 3. Insert Initial Member (Owner)
    INSERT INTO public.workspace_members (workspace_id, user_id, role_id, created_by)
    VALUES (new_ws_id, auth.uid(), owner_role_id, auth.uid());

    -- 4. Create default general channel
    INSERT INTO public.channels (workspace_id, name, type, created_by)
    VALUES (new_ws_id, 'general', 'text', auth.uid());

    RETURN new_ws_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
