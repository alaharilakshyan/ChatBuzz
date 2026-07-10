-- Migration 0004: Workspaces, Roles, and Membership RBAC
-- Configures workspace schemas, role management arrays, and membership mapping.

-- Create workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    icon_url TEXT,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(name, '')) || 
        to_tsvector('english', coalesce(slug, ''))
    ) STORED,

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Unique index and GIN search index for workspaces
CREATE INDEX IF NOT EXISTS workspaces_search_idx ON public.workspaces USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS workspaces_deleted_at_idx ON public.workspaces (deleted_at);

-- Create workspace_roles table
CREATE TABLE IF NOT EXISTS public.workspace_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    permissions TEXT[] NOT NULL DEFAULT '{}'::text[],

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT unique_workspace_role_name UNIQUE (workspace_id, name)
);

CREATE INDEX IF NOT EXISTS workspace_roles_workspace_idx ON public.workspace_roles (workspace_id) WHERE deleted_at IS NULL;

-- Create workspace_members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.workspace_roles(id) ON DELETE RESTRICT,

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS workspace_members_unique_idx ON public.workspace_members (workspace_id, user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS workspace_members_user_idx ON public.workspace_members (user_id) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspaces Policies
CREATE POLICY "workspaces_select_policy" ON public.workspaces
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND deleted_at IS NULL AND EXISTS (
            SELECT 1 FROM public.workspace_members 
            WHERE workspace_id = public.workspaces.id AND user_id = auth.uid() AND deleted_at IS NULL
        )
    );

CREATE POLICY "workspaces_insert_policy" ON public.workspaces
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "workspaces_update_policy" ON public.workspaces
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "workspaces_delete_policy" ON public.workspaces
    FOR UPDATE USING (auth.uid() = owner_id);

-- Workspace Roles Policies
CREATE POLICY "workspace_roles_select_policy" ON public.workspace_roles
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND deleted_at IS NULL AND EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_id = public.workspace_roles.workspace_id AND user_id = auth.uid() AND deleted_at IS NULL
        )
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

-- Workspace Members Policies
CREATE POLICY "workspace_members_select_policy" ON public.workspace_members
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND deleted_at IS NULL AND EXISTS (
            SELECT 1 FROM public.workspace_members AS wm 
            WHERE wm.workspace_id = public.workspace_members.workspace_id AND wm.user_id = auth.uid() AND wm.deleted_at IS NULL
        )
    );

CREATE POLICY "workspace_members_insert_policy" ON public.workspace_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members AS wm
            JOIN public.workspace_roles AS wr ON wm.role_id = wr.id
            WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid() 
            AND wr.permissions @> ARRAY['invite_users'] AND wm.deleted_at IS NULL
        ) OR 
        -- Allow the creator/owner to insert the initial member record
        EXISTS (
            SELECT 1 FROM public.workspaces 
            WHERE id = workspace_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "workspace_members_update_policy" ON public.workspace_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members AS wm
            JOIN public.workspace_roles AS wr ON wm.role_id = wr.id
            WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid() 
            AND wr.permissions @> ARRAY['manage_members'] AND wm.deleted_at IS NULL
        )
    );

CREATE POLICY "workspace_members_delete_policy" ON public.workspace_members
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.workspace_members AS wm
            JOIN public.workspace_roles AS wr ON wm.role_id = wr.id
            WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid() 
            AND wr.permissions @> ARRAY['manage_members'] AND wm.deleted_at IS NULL
        )
    );
