-- Ensure backgrounds bucket is correctly cataloged
INSERT INTO storage.buckets (id, name, public)
VALUES ('backgrounds', 'backgrounds', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Clean up any existing policies on the backgrounds bucket to prevent conflicts
DROP POLICY IF EXISTS "Allow authenticated uploads to backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update/delete their own backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "backgrounds_select" ON storage.objects;
DROP POLICY IF EXISTS "backgrounds_insert" ON storage.objects;
DROP POLICY IF EXISTS "backgrounds_update" ON storage.objects;
DROP POLICY IF EXISTS "backgrounds_delete" ON storage.objects;

-- 1. Allow Authenticated users to upload background images
CREATE POLICY "Allow authenticated uploads to backgrounds"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'backgrounds');

-- 2. Allow Public reading of background images
CREATE POLICY "Allow public read from backgrounds"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'backgrounds');

-- 3. Allow users to update/delete background objects
CREATE POLICY "Allow users to update/delete their own backgrounds"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'backgrounds');
