-- Migration 0014: Recreate Avatars policies on storage.objects
-- Uses standard Postgres string matching for paths to ensure maximum compatibility.

DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete" ON storage.objects;

-- Allow public viewing of avatars
CREATE POLICY "avatars_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload to their own folder path
CREATE POLICY "avatars_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        (name LIKE (auth.uid()::text || '/%'))
    );

-- Allow authenticated users to update their own files
CREATE POLICY "avatars_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND 
        (name LIKE (auth.uid()::text || '/%'))
    );

-- Allow authenticated users to delete their own files
CREATE POLICY "avatars_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND 
        (name LIKE (auth.uid()::text || '/%'))
    );
