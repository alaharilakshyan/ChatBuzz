-- Migration 0015: Create Branding Storage Bucket
-- Seed branding bucket in storage and allow public SELECT access.

INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Public SELECT policy for the branding bucket
DROP POLICY IF EXISTS "branding_select" ON storage.objects;
CREATE POLICY "branding_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'branding');
