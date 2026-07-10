-- Migration 0006: Friendships, Requests, and Block lists
-- Sets up social relationship maps and block boundaries.

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status public.friend_request_status NOT NULL DEFAULT 'pending'::public.friend_request_status,

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT requester_recipient_diff CHECK (requester_id <> recipient_id),
    CONSTRAINT unique_friend_request_pair UNIQUE (requester_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS friend_requests_recipient_idx ON public.friend_requests (recipient_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS friend_requests_deleted_at_idx ON public.friend_requests (deleted_at);

-- Create friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT user1_less_than_user2 CHECK (user1_id < user2_id),
    CONSTRAINT unique_friendship_pair UNIQUE (user1_id, user2_id)
);

CREATE INDEX IF NOT EXISTS friendships_user2_idx ON public.friendships (user2_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS friendships_deleted_at_idx ON public.friendships (deleted_at);

-- Create blocks table
CREATE TABLE IF NOT EXISTS public.blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT blocker_blocked_diff CHECK (blocker_id <> blocked_id),
    CONSTRAINT unique_block_pair UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS blocks_blocked_idx ON public.blocks (blocked_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS blocks_deleted_at_idx ON public.blocks (deleted_at);

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Friend Requests Policies
CREATE POLICY "friend_requests_select" ON public.friend_requests
    FOR SELECT USING (auth.uid() IN (requester_id, recipient_id) AND deleted_at IS NULL);

CREATE POLICY "friend_requests_insert" ON public.friend_requests
    FOR INSERT WITH CHECK (
        auth.uid() = requester_id AND 
        NOT EXISTS (
            SELECT 1 FROM public.blocks 
            WHERE ((blocker_id = auth.uid() AND blocked_id = recipient_id) OR (blocker_id = recipient_id AND blocked_id = auth.uid())) 
            AND deleted_at IS NULL
        )
    );

CREATE POLICY "friend_requests_update" ON public.friend_requests
    FOR UPDATE USING (auth.uid() = recipient_id AND deleted_at IS NULL);

CREATE POLICY "friend_requests_delete" ON public.friend_requests
    FOR DELETE USING (auth.uid() IN (requester_id, recipient_id));

-- Friendships Policies
CREATE POLICY "friendships_select" ON public.friendships
    FOR SELECT USING (auth.uid() IN (user1_id, user2_id) AND deleted_at IS NULL);

CREATE POLICY "friendships_insert" ON public.friendships
    FOR INSERT WITH CHECK (auth.uid() IN (user1_id, user2_id));

CREATE POLICY "friendships_update" ON public.friendships
    FOR UPDATE USING (auth.uid() IN (user1_id, user2_id));

CREATE POLICY "friendships_delete" ON public.friendships
    FOR DELETE USING (auth.uid() IN (user1_id, user2_id));

-- Blocks Policies
CREATE POLICY "blocks_select" ON public.blocks
    FOR SELECT USING (auth.uid() = blocker_id AND deleted_at IS NULL);

CREATE POLICY "blocks_insert" ON public.blocks
    FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "blocks_update" ON public.blocks
    FOR UPDATE USING (auth.uid() = blocker_id);

CREATE POLICY "blocks_delete" ON public.blocks
    FOR DELETE USING (auth.uid() = blocker_id);
