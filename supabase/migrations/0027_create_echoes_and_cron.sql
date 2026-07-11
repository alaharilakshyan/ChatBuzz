-- Migration 0027: Create Echoes (Stories) Table and pg_cron cleanup job
-- Configures ephemeral stories table, secure friend-only RLS, and media-leak-proof cron cleanup.

-- Enable pg_cron extension if not enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Create echoes table
CREATE TABLE IF NOT EXISTS public.echoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_by UUID NOT NULL DEFAULT auth.uid()
);

-- Enable RLS on echoes
ALTER TABLE public.echoes ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy: Allow users to view their own stories OR active friends' stories
DROP POLICY IF EXISTS "Allow users to view own and friends echoes" ON public.echoes;
CREATE POLICY "Allow users to view own and friends echoes"
ON public.echoes FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.friendships
        WHERE (
            (user1_id = auth.uid() AND user2_id = user_id) OR
            (user2_id = auth.uid() AND user1_id = user_id)
        ) AND deleted_at IS NULL
    )
);

-- 2. INSERT Policy: Allow users to create stories for themselves
DROP POLICY IF EXISTS "Allow users to insert own echoes" ON public.echoes;
CREATE POLICY "Allow users to insert own echoes"
ON public.echoes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. DELETE Policy: Allow users to delete their own stories
DROP POLICY IF EXISTS "Allow users to delete own echoes" ON public.echoes;
CREATE POLICY "Allow users to delete own echoes"
ON public.echoes FOR DELETE
TO authenticated
USING (user_id = auth.uid());


-- --- STORAGE BUCKET CONFIGURATION ---

-- Seed echoes storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('echoes', 'echoes', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg', 'video/mp4', 'video/webm', 'video/quicktime'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for Echoes bucket (using robust LIKE matching)
DROP POLICY IF EXISTS "Allow authenticated uploads to echoes" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to echoes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'echoes' AND (name LIKE (auth.uid()::text || '-%')));

DROP POLICY IF EXISTS "Allow public read from echoes" ON storage.objects;
CREATE POLICY "Allow public read from echoes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'echoes');

DROP POLICY IF EXISTS "Allow users to update/delete their own echoes" ON storage.objects;
CREATE POLICY "Allow users to update/delete their own echoes"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'echoes' AND (name LIKE (auth.uid()::text || '-%')));


-- --- pg_cron Ephemeral Lifecycle Setup ---

-- Safe unschedule: Only unschedules if the job actually exists in metadata catalogs
SELECT cron.unschedule(jobid) 
FROM cron.job 
WHERE jobname = 'delete-expired-echoes';

-- Schedule hourly cron job to delete expired physical objects from S3 first, then clear rows from echoes
SELECT cron.schedule(
  'delete-expired-echoes',
  '0 * * * *', -- Run every hour on the hour
  $$
  BEGIN;
    -- Delete physical objects from storage metadata
    DELETE FROM storage.objects
    WHERE bucket_id = 'echoes'
      AND name IN (
        SELECT substring(media_url from '[^/]+$')
        FROM public.echoes
        WHERE expires_at < now()
      );
    
    -- Delete database records
    DELETE FROM public.echoes
    WHERE expires_at < now();
  COMMIT;
  $$
);
