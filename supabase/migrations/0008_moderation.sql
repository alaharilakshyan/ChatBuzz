-- Migration 0008: Moderation tickets, Evidence, and Actions logging
-- Establishes the report system, proof uploads, and moderation audit trails.

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS reports_reported_idx ON public.reports (reported_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports (status) WHERE deleted_at IS NULL;

-- Create report_evidence table
CREATE TABLE IF NOT EXISTS public.report_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    evidence_url TEXT NOT NULL,
    evidence_type TEXT NOT NULL,

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS report_evidence_report_idx ON public.report_evidence (report_id) WHERE deleted_at IS NULL;

-- Create moderation_actions table
CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
    target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    action_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    duration INTERVAL,
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Audit Columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS moderation_actions_target_idx ON public.moderation_actions (target_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS moderation_actions_type_idx ON public.moderation_actions (action_type) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- Reports Policies
CREATE POLICY "reports_select" ON public.reports
    FOR SELECT USING (auth.uid() = reporter_id AND deleted_at IS NULL);

CREATE POLICY "reports_insert" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_delete" ON public.reports
    FOR DELETE USING (auth.uid() = reporter_id);

-- Report Evidence Policies
CREATE POLICY "evidence_select" ON public.report_evidence
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reports 
            WHERE id = report_id AND reporter_id = auth.uid() AND deleted_at IS NULL
        )
    );

CREATE POLICY "evidence_insert" ON public.report_evidence
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.reports 
            WHERE id = report_id AND reporter_id = auth.uid() AND deleted_at IS NULL
        )
    );

CREATE POLICY "evidence_delete" ON public.report_evidence
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.reports 
            WHERE id = report_id AND reporter_id = auth.uid() AND deleted_at IS NULL
        )
    );

-- Moderation Actions Policies
CREATE POLICY "moderation_actions_select" ON public.moderation_actions
    FOR SELECT USING (auth.uid() = target_user_id AND deleted_at IS NULL);

-- Inserting moderation actions is restricted to system operations / admin services
CREATE POLICY "moderation_actions_insert" ON public.moderation_actions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members AS wm
            JOIN public.workspace_roles AS wr ON wm.role_id = wr.id
            WHERE wm.user_id = auth.uid() AND wr.permissions @> ARRAY['moderate'] AND wm.deleted_at IS NULL
        )
    );
