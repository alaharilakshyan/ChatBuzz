-- Migration 0009: Polymorphic Notifications Dispatch
-- Sets up notification stores linking to varying entity types without null-column mapping.

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications (user_id, is_read) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS notifications_polymorphic_idx ON public.notifications (entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS notifications_deleted_at_idx ON public.notifications (deleted_at);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "notifications_select" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "notifications_insert" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = created_by); -- Allows system triggers to write

CREATE POLICY "notifications_update" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);
