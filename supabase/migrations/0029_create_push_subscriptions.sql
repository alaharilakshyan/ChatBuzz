-- Migration 0029: Create Push Subscriptions Table
-- Configures browser push gateway tokens database structure and strict owner RLS.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 1. ALL Policies: Allow users to manage (select, insert, delete) only their own push subscriptions
DROP POLICY IF EXISTS "Allow users to manage own push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow users to manage own push_subscriptions"
ON public.push_subscriptions FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
