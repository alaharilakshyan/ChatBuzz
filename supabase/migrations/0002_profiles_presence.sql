-- Migration 0002: Profiles & Presence Tables
-- Sets up the profiles and presence schemas with soft-deletes and GIN-based Full-Text Search.

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    user_tag TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    public_key TEXT,
    preferences JSONB NOT NULL DEFAULT '{"onlineStatusVisible": true, "readReceiptsEnabled": true, "typingIndicatorsEnabled": true, "messageNotificationsEnabled": true, "soundEnabled": true}'::jsonb,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(username, '')) || 
        to_tsvector('english', coalesce(bio, ''))
    ) STORED,
    
    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Constraint for uniqueness on username and user_tag
ALTER TABLE public.profiles ADD CONSTRAINT unique_username_tag UNIQUE (username, user_tag);

-- Create GIN index for search vector
CREATE INDEX IF NOT EXISTS profiles_search_idx ON public.profiles USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS profiles_deleted_at_idx ON public.profiles (deleted_at);

-- Create presence table
CREATE TABLE IF NOT EXISTS public.presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    status public.presence_status NOT NULL DEFAULT 'offline'::public.presence_status,
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    device TEXT,
    platform TEXT,
    heartbeat_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for presence
CREATE INDEX IF NOT EXISTS presence_status_seen_idx ON public.presence (status, last_seen) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS presence_deleted_at_idx ON public.presence (deleted_at);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_policy" ON public.profiles
    FOR UPDATE USING (auth.uid() = id); -- Soft delete via update trigger or direct update

-- Presence policies
CREATE POLICY "presence_select_policy" ON public.presence
    FOR SELECT USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "presence_insert_policy" ON public.presence
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "presence_update_policy" ON public.presence
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "presence_delete_policy" ON public.presence
    FOR UPDATE USING (auth.uid() = user_id);
