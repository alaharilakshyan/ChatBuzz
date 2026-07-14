-- Migration 0036: Fix Create Workspace Channels Mismatch
-- Redefines the create_workspace function to align with the active public.channels schema (no type column).

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

    -- 4. Create default general channel (removed invalid type column)
    INSERT INTO public.channels (workspace_id, name, created_by)
    VALUES (new_ws_id, 'general', auth.uid());

    RETURN new_ws_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
