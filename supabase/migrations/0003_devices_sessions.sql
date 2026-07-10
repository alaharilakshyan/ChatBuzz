-- Migration 0003: User Devices (Push notification and session targets)
-- Sets up device registries and maps push tokens to users.

CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    browser TEXT,
    ip INET,
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    push_token TEXT,

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS user_devices_user_id_idx ON public.user_devices (user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_devices_token_unique_idx ON public.user_devices (user_id, push_token) WHERE push_token IS NOT NULL AND deleted_at IS NULL;

-- Enable RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "user_devices_select_policy" ON public.user_devices
    FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "user_devices_insert_policy" ON public.user_devices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_devices_update_policy" ON public.user_devices
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_devices_delete_policy" ON public.user_devices
    FOR DELETE USING (auth.uid() = user_id);
