-- Migration 0022: Align backgrounds storage bucket schema details
-- Ensures backgrounds bucket has file size constraints and mime types aligned with avatars bucket.

UPDATE storage.buckets
SET 
  file_size_limit = 10485760, -- 10MB limit
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
WHERE id = 'backgrounds';
