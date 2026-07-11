-- Migration 0026: Recreate All Storage Policies
-- Clears all potentially invalid policies on storage.objects and establishes simple, compatible, error-free policies.

-- 1. Drop ALL existing policies on storage.objects to clear compile/execution errors
DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete" ON storage.objects;

DROP POLICY IF EXISTS "banners_select" ON storage.objects;
DROP POLICY IF EXISTS "banners_insert" ON storage.objects;
DROP POLICY IF EXISTS "banners_update" ON storage.objects;
DROP POLICY IF EXISTS "banners_delete" ON storage.objects;

DROP POLICY IF EXISTS "backgrounds_select" ON storage.objects;
DROP POLICY IF EXISTS "backgrounds_insert" ON storage.objects;
DROP POLICY IF EXISTS "backgrounds_update" ON storage.objects;
DROP POLICY IF EXISTS "backgrounds_delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update/delete their own backgrounds" ON storage.objects;

DROP POLICY IF EXISTS "branding_select" ON storage.objects;

DROP POLICY IF EXISTS "attachments_select" ON storage.objects;
DROP POLICY IF EXISTS "attachments_insert" ON storage.objects;

DROP POLICY IF EXISTS "voice_notes_select" ON storage.objects;
DROP POLICY IF EXISTS "voice_notes_insert" ON storage.objects;

DROP POLICY IF EXISTS "temp_files_all" ON storage.objects;

-- 2. Create Compatible, Safe Policies

-- --- AVATARS BUCKET ---
CREATE POLICY "avatars_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (name LIKE (auth.uid()::text || '/%')));
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (name LIKE (auth.uid()::text || '/%')));
CREATE POLICY "avatars_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (name LIKE (auth.uid()::text || '/%')));

-- --- BANNERS BUCKET ---
CREATE POLICY "banners_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'banners');
CREATE POLICY "banners_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banners' AND (name LIKE (auth.uid()::text || '/%')));
CREATE POLICY "banners_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'banners' AND (name LIKE (auth.uid()::text || '/%')));
CREATE POLICY "banners_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'banners' AND (name LIKE (auth.uid()::text || '/%')));

-- --- BACKGROUNDS BUCKET ---
CREATE POLICY "backgrounds_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'backgrounds');
CREATE POLICY "backgrounds_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'backgrounds');
CREATE POLICY "backgrounds_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'backgrounds');
CREATE POLICY "backgrounds_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'backgrounds');

-- --- BRANDING BUCKET ---
CREATE POLICY "branding_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'branding');

-- --- ATTACHMENTS BUCKET (Clean, foldername-free pattern) ---
CREATE POLICY "attachments_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'attachments');
CREATE POLICY "attachments_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments');

-- --- VOICE-NOTES BUCKET (Clean, foldername-free pattern) ---
CREATE POLICY "voice_notes_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'voice-notes');
CREATE POLICY "voice_notes_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'voice-notes');

-- --- TEMP-FILES BUCKET ---
CREATE POLICY "temp_files_all" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'temp-files');
