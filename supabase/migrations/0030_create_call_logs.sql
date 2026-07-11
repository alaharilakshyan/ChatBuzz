-- Migration 0030: Create Call Logs Table
-- Stores metadata of direct voice/video calls between users with RLS rules.

CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  status TEXT NOT NULL CHECK (status IN ('answered', 'missed', 'declined', 'completed')),
  duration INTEGER, -- Call duration in seconds (can be NULL for missed/declined calls)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy: Users can only read call logs where they were the caller or the receiver
DROP POLICY IF EXISTS "Users can view own call logs" ON public.call_logs;
CREATE POLICY "Users can view own call logs"
ON public.call_logs FOR SELECT
TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- 2. INSERT Policy: Authenticated users can insert call logs
DROP POLICY IF EXISTS "Users can insert call logs" ON public.call_logs;
CREATE POLICY "Users can insert call logs"
ON public.call_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = caller_id);
