-- Migration 0021: Fix Backgrounds storage bucket policies
-- Updates the RLS check to use the native foldername helper function instead of string LIKE operator.

DROP POLICY IF EXISTS "backgrounds_insert" ON storage.objects;
CREATE POLICY "backgrounds_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'backgrounds' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "backgrounds_update" ON storage.objects;
CREATE POLICY "backgrounds_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'backgrounds' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "backgrounds_delete" ON storage.objects;
CREATE POLICY "backgrounds_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'backgrounds' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );
