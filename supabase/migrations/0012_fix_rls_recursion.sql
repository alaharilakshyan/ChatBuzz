-- Migration 0012: Fix Workspace Members RLS Infinite Recursion
-- Creates a SECURITY DEFINER function to bypass recursive RLS policies.

CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID, u_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws_id AND user_id = u_id AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Drop old recursive policies
DROP POLICY IF EXISTS "workspaces_select_policy" ON public.workspaces;
DROP POLICY IF EXISTS "workspace_roles_select_policy" ON public.workspace_roles;
DROP POLICY IF EXISTS "workspace_roles_write_policy" ON public.workspace_roles;
DROP POLICY IF EXISTS "workspace_members_select_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete_policy" ON public.workspace_members;

-- Re-create Workspaces Policies using the helper
CREATE POLICY "workspaces_select_policy" ON public.workspaces
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND deleted_at IS NULL AND public.is_workspace_member(id, auth.uid())
    );

-- Re-create Workspace Roles Policies
CREATE POLICY "workspace_roles_select_policy" ON public.workspace_roles
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND deleted_at IS NULL AND public.is_workspace_member(workspace_id, auth.uid())
    );

CREATE POLICY "workspace_roles_write_policy" ON public.workspace_roles
    FOR ALL USING (
        deleted_at IS NULL AND EXISTS (
            SELECT 1 FROM public.workspace_members AS wm
            JOIN public.workspace_roles AS wr ON wm.role_id = wr.id
            WHERE wm.workspace_id = public.workspace_roles.workspace_id AND wm.user_id = auth.uid() 
            AND wr.permissions @> ARRAY['manage_roles'] AND wm.deleted_at IS NULL
        )
    );

-- Re-create Workspace Members Policies
CREATE POLICY "workspace_members_select_policy" ON public.workspace_members
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND deleted_at IS NULL AND public.is_workspace_member(workspace_id, auth.uid())
    );

CREATE POLICY "workspace_members_insert_policy" ON public.workspace_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members AS wm
            JOIN public.workspace_roles AS wr ON wm.role_id = wr.id
            WHERE wm.workspace_id = public.workspace_members.workspace_id AND wm.user_id = auth.uid() 
            AND wr.permissions @> ARRAY['invite_users'] AND wm.deleted_at IS NULL
        ) OR 
        EXISTS (
            SELECT 1 FROM public.workspaces 
            WHERE id = public.workspace_members.workspace_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "workspace_members_update_policy" ON public.workspace_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members AS wm
            JOIN public.workspace_roles AS wr ON wm.role_id = wr.id
            WHERE wm.workspace_id = public.workspace_members.workspace_id AND wm.user_id = auth.uid() 
            AND wr.permissions @> ARRAY['manage_members'] AND wm.deleted_at IS NULL
        )
    );

CREATE POLICY "workspace_members_delete_policy" ON public.workspace_members
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.workspace_members AS wm
            JOIN public.workspace_roles AS wr ON wm.role_id = wr.id
            WHERE wm.workspace_id = public.workspace_members.workspace_id AND wm.user_id = auth.uid() 
            AND wr.permissions @> ARRAY['manage_members'] AND wm.deleted_at IS NULL
        )
    );
