-- Migration 0007: Messages, Attachments, Reads, Deliveries, and Reactions
-- Implements the primary chat message structure, media attachments, and tracking tables.

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    content TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_ephemeral BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_one_time_view BOOLEAN NOT NULL DEFAULT false,
    reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(content, ''))
    ) STORED,

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT message_target_xor CHECK (
        (channel_id IS NOT NULL AND receiver_id IS NULL) OR 
        (channel_id IS NULL AND receiver_id IS NOT NULL)
    )
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS messages_channel_idx ON public.messages (channel_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS messages_dm_idx ON public.messages (sender_id, receiver_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS messages_search_idx ON public.messages USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS messages_expiry_idx ON public.messages (expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS messages_deleted_at_idx ON public.messages (deleted_at);

-- Create attachments table
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    duration INTERVAL,
    storage_path TEXT NOT NULL,
    checksum TEXT NOT NULL,
    blurhash TEXT,

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS attachments_message_idx ON public.attachments (message_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS attachments_deleted_at_idx ON public.attachments (deleted_at);

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT unique_message_user_emoji UNIQUE (message_id, user_id, emoji)
);

CREATE UNIQUE INDEX IF NOT EXISTS message_reactions_unique_idx ON public.message_reactions (message_id, user_id, emoji) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS message_reactions_deleted_at_idx ON public.message_reactions (deleted_at);

-- Create message_deliveries table
CREATE TABLE IF NOT EXISTS public.message_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    delivered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT unique_message_delivery UNIQUE (message_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS message_deliveries_unique_idx ON public.message_deliveries (message_id, user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS message_deliveries_deleted_at_idx ON public.message_deliveries (deleted_at);

-- Create message_reads table
CREATE TABLE IF NOT EXISTS public.message_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    viewed_at TIMESTAMP WITH TIME ZONE,

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT unique_message_read UNIQUE (message_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS message_reads_unique_idx ON public.message_reads (message_id, user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS message_reads_deleted_at_idx ON public.message_reads (deleted_at);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Messages Policies
CREATE POLICY "messages_select_policy" ON public.messages
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND deleted_at IS NULL AND (
            (receiver_id IS NOT NULL AND auth.uid() IN (sender_id, receiver_id)) OR
            (channel_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.channels AS ch
                JOIN public.workspace_members AS wm ON ch.workspace_id = wm.workspace_id
                WHERE ch.id = channel_id AND wm.user_id = auth.uid() AND wm.deleted_at IS NULL
                AND (ch.is_private = false OR EXISTS (
                    SELECT 1 FROM public.channel_members 
                    WHERE channel_id = ch.id AND user_id = auth.uid() AND deleted_at IS NULL
                ))
            ))
        )
    );

CREATE POLICY "messages_insert_policy" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND (
            (receiver_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.friendships 
                WHERE ((user1_id = auth.uid() AND user2_id = receiver_id) OR (user1_id = receiver_id AND user2_id = auth.uid())) 
                AND deleted_at IS NULL
            ) AND NOT EXISTS (
                SELECT 1 FROM public.blocks 
                WHERE ((blocker_id = auth.uid() AND blocked_id = receiver_id) OR (blocker_id = receiver_id AND blocked_id = auth.uid())) 
                AND deleted_at IS NULL
            )) OR
            (channel_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.channels AS ch
                JOIN public.workspace_members AS wm ON ch.workspace_id = wm.workspace_id
                WHERE ch.id = channel_id AND wm.user_id = auth.uid() AND wm.deleted_at IS NULL
                AND (ch.is_private = false OR EXISTS (
                    SELECT 1 FROM public.channel_members 
                    WHERE channel_id = ch.id AND user_id = auth.uid() AND deleted_at IS NULL
                ))
            ))
        )
    );

CREATE POLICY "messages_update_policy" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "messages_delete_policy" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id); -- Soft delete via update trigger

-- Attachments Policies
CREATE POLICY "attachments_select" ON public.attachments
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND deleted_at IS NULL AND EXISTS (
            SELECT 1 FROM public.messages WHERE id = message_id
        )
    );

CREATE POLICY "attachments_insert" ON public.attachments
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND EXISTS (
            SELECT 1 FROM public.messages WHERE id = message_id AND sender_id = auth.uid()
        )
    );

CREATE POLICY "attachments_update" ON public.attachments
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "attachments_delete" ON public.attachments
    FOR UPDATE USING (auth.uid() = created_by);

-- Message Reactions Policies
CREATE POLICY "reactions_select" ON public.message_reactions
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND deleted_at IS NULL AND EXISTS (
            SELECT 1 FROM public.messages WHERE id = message_id
        )
    );

CREATE POLICY "reactions_insert" ON public.message_reactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND EXISTS (
            SELECT 1 FROM public.messages WHERE id = message_id
        )
    );

CREATE POLICY "reactions_delete" ON public.message_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Message Deliveries Policies
CREATE POLICY "deliveries_select" ON public.message_deliveries
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND deleted_at IS NULL AND EXISTS (
            SELECT 1 FROM public.messages WHERE id = message_id
        )
    );

CREATE POLICY "deliveries_insert" ON public.message_deliveries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "deliveries_update" ON public.message_deliveries
    FOR UPDATE USING (auth.uid() = user_id);

-- Message Reads Policies
CREATE POLICY "reads_select" ON public.message_reads
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND deleted_at IS NULL AND EXISTS (
            SELECT 1 FROM public.messages WHERE id = message_id
        )
    );

CREATE POLICY "reads_insert" ON public.message_reads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reads_update" ON public.message_reads
    FOR UPDATE USING (auth.uid() = user_id);
