-- Migration 0016: Add banner_url to profiles and setup banners storage bucket
-- Extends the profiles table and configures storage.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Seed banners bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Public SELECT policy for the banners bucket
DROP POLICY IF EXISTS "banners_select" ON storage.objects;
CREATE POLICY "banners_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'banners');

-- Insert policy for authenticated users inside their own user path
DROP POLICY IF EXISTS "banners_insert" ON storage.objects;
CREATE POLICY "banners_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'banners' AND 
        (name LIKE (auth.uid()::text || '/%'))
    );

-- Update policy for authenticated users inside their own user path
DROP POLICY IF EXISTS "banners_update" ON storage.objects;
CREATE POLICY "banners_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'banners' AND 
        (name LIKE (auth.uid()::text || '/%'))
    );

-- Delete policy for authenticated users inside their own user path
DROP POLICY IF EXISTS "banners_delete" ON storage.objects;
CREATE POLICY "banners_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'banners' AND 
        (name LIKE (auth.uid()::text || '/%'))
    );
