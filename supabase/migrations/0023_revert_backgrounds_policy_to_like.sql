-- Migration 0023: Revert backgrounds storage policies to LIKE match
-- Replaces foldername array parsing with standard compatible string prefix checks.

DROP POLICY IF EXISTS "backgrounds_insert" ON storage.objects;
CREATE POLICY "backgrounds_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'backgrounds' AND 
        (name LIKE (auth.uid()::text || '/%'))
    );

DROP POLICY IF EXISTS "backgrounds_update" ON storage.objects;
CREATE POLICY "backgrounds_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'backgrounds' AND 
        (name LIKE (auth.uid()::text || '/%'))
    );

DROP POLICY IF EXISTS "backgrounds_delete" ON storage.objects;
CREATE POLICY "backgrounds_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'backgrounds' AND 
        (name LIKE (auth.uid()::text || '/%'))
    );
