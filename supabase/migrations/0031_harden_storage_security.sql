-- Migration 0031: Harden storage security policies
-- Updates backgrounds and echoes storage policies to restrict insert/update/delete permissions to own user ID prefixes.

-- ==========================================
-- 1. Harden backgrounds bucket policies
-- ==========================================
DROP POLICY IF EXISTS "Allow authenticated uploads to backgrounds" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to backgrounds"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'backgrounds' AND 
  (name LIKE (auth.uid()::text || '-%'))
);

DROP POLICY IF EXISTS "Allow users to update/delete their own backgrounds" ON storage.objects;
CREATE POLICY "Allow users to update/delete their own backgrounds"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'backgrounds' AND 
  (name LIKE (auth.uid()::text || '-%'))
);

-- ==========================================
-- 2. Harden echoes bucket policies
-- ==========================================
DROP POLICY IF EXISTS "Allow authenticated uploads to echoes" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to echoes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'echoes' AND 
  (name LIKE (auth.uid()::text || '-%'))
);

DROP POLICY IF EXISTS "Allow users to update/delete their own echoes" ON storage.objects;
CREATE POLICY "Allow users to update/delete their own echoes"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'echoes' AND 
  (name LIKE (auth.uid()::text || '-%'))
);
