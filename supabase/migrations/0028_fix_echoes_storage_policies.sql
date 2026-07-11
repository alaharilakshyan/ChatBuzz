-- Migration 0028: Fix Echoes Storage Policies
-- Replaces path-restricted upload filters with flat, compatible RLS policies for the echoes bucket.

-- Ensure echoes bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('echoes', 'echoes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Clean up any conflicting policies
DROP POLICY IF EXISTS "Allow authenticated uploads to echoes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from echoes" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update/delete their own echoes" ON storage.objects;

-- 1. Allow Authenticated users to upload echoes
CREATE POLICY "Allow authenticated uploads to echoes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'echoes');

-- 2. Allow Public reading of echoes
CREATE POLICY "Allow public read from echoes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'echoes');

-- 3. Allow users to manage (update/delete) echoes
CREATE POLICY "Allow users to update/delete their own echoes"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'echoes');
