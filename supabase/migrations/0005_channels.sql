-- Migration 0005: Channels and Private Channel Memberships
-- Sets up channels within workspaces and private channel memberships (ACLs).

-- Create channels table
CREATE TABLE IF NOT EXISTS public.channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT false,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(name, ''))
    ) STORED,

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS channels_search_idx ON public.channels USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS channels_workspace_name_idx ON public.channels (workspace_id, name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS channels_deleted_at_idx ON public.channels (deleted_at);

-- Create channel_members table
CREATE TABLE IF NOT EXISTS public.channel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS channel_members_unique_idx ON public.channel_members (channel_id, user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS channel_members_deleted_at_idx ON public.channel_members (deleted_at);

-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- Channels Policies
CREATE POLICY "channels_select_policy" ON public.channels
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND deleted_at IS NULL AND EXISTS (
            SELECT 1 FROM public.workspace_members 
            WHERE workspace_id = public.channels.workspace_id AND user_id = auth.uid() AND deleted_at IS NULL
        ) AND (
            is_private = false OR EXISTS (
                SELECT 1 FROM public.channel_members 
                WHERE channel_id = public.channels.id AND user_id = auth.uid() AND deleted_at IS NULL
            )
        )
    );

CREATE POLICY "channels_insert_policy" ON public.channels
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members AS wm
            JOIN public.workspace_roles AS wr ON wm.role_id = wr.id
            WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid() 
            AND wr.permissions @> ARRAY['manage_channels'] AND wm.deleted_at IS NULL
        )
    );

CREATE POLICY "channels_update_policy" ON public.channels
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members AS wm
            JOIN public.workspace_roles AS wr ON wm.role_id = wr.id
            WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid() 
            AND wr.permissions @> ARRAY['manage_channels'] AND wm.deleted_at IS NULL
        )
    );

CREATE POLICY "channels_delete_policy" ON public.channels
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members AS wm
            JOIN public.workspace_roles AS wr ON wm.role_id = wr.id
            WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid() 
            AND wr.permissions @> ARRAY['manage_channels'] AND wm.deleted_at IS NULL
        )
    );

-- Channel Members Policies
CREATE POLICY "channel_members_select_policy" ON public.channel_members
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND deleted_at IS NULL AND EXISTS (
            SELECT 1 FROM public.channel_members AS cm 
            WHERE cm.channel_id = public.channel_members.channel_id AND cm.user_id = auth.uid() AND cm.deleted_at IS NULL
        )
    );

CREATE POLICY "channel_members_insert_policy" ON public.channel_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.channels AS ch
            JOIN public.workspace_members AS wm ON ch.workspace_id = wm.workspace_id
            JOIN public.workspace_roles AS wr ON wm.role_id = wr.id
            WHERE ch.id = channel_id AND wm.user_id = auth.uid() 
            AND wr.permissions @> ARRAY['manage_channels'] AND wm.deleted_at IS NULL
        )
    );

CREATE POLICY "channel_members_delete_policy" ON public.channel_members
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.channels AS ch
            JOIN public.workspace_members AS wm ON ch.workspace_id = wm.workspace_id
            JOIN public.workspace_roles AS wr ON wm.role_id = wr.id
            WHERE ch.id = channel_id AND wm.user_id = auth.uid() 
            AND wr.permissions @> ARRAY['manage_channels'] AND wm.deleted_at IS NULL
        )
    );
