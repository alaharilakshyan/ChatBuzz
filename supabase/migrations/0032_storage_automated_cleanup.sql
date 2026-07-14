-- Migration 0032: Automated Storage Cleanup Triggers
-- Automatically deletes physical assets from storage.objects when rows are updated or deleted in the database.

-- 1. Helper function to extract storage paths from public URLs
CREATE OR REPLACE FUNCTION public.extract_storage_path(url TEXT, bucket_name TEXT)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
BEGIN
    IF url IS NULL OR url = '' THEN
        RETURN NULL;
    END IF;
    prefix := '/storage/v1/object/public/' || bucket_name || '/';
    IF position(prefix in url) > 0 THEN
        RETURN substring(url from position(prefix in url) + char_length(prefix));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Triggers for profiles table (avatar and banner cleanups)
CREATE OR REPLACE FUNCTION public.on_profile_storage_update()
RETURNS TRIGGER AS $$
DECLARE
    old_path TEXT;
BEGIN
    -- Cleanup old avatar when updated
    IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url AND OLD.avatar_url IS NOT NULL THEN
        old_path := public.extract_storage_path(OLD.avatar_url, 'avatars');
        IF old_path IS NOT NULL THEN
            DELETE FROM storage.objects WHERE bucket_id = 'avatars' AND name = old_path;
        END IF;
    END IF;

    -- Cleanup old banner when updated
    IF OLD.banner_url IS DISTINCT FROM NEW.banner_url AND OLD.banner_url IS NOT NULL THEN
        old_path := public.extract_storage_path(OLD.banner_url, 'banners');
        IF old_path IS NOT NULL THEN
            DELETE FROM storage.objects WHERE bucket_id = 'banners' AND name = old_path;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_profile_storage_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.on_profile_storage_update();


-- Cleanup all files when user is deleted
CREATE OR REPLACE FUNCTION public.on_profile_deleted()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete all files prefixed with the user ID across all user storage buckets
    DELETE FROM storage.objects WHERE bucket_id = 'avatars' AND (storage.foldername(name))[1] = OLD.id::text;
    DELETE FROM storage.objects WHERE bucket_id = 'banners' AND name LIKE (OLD.id::text || '/%');
    DELETE FROM storage.objects WHERE bucket_id = 'backgrounds' AND name LIKE (OLD.id::text || '-%');
    DELETE FROM storage.objects WHERE bucket_id = 'echoes' AND name LIKE (OLD.id::text || '-%');
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_profile_deleted
AFTER DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.on_profile_deleted();


-- 3. Triggers for echoes (stories) table
CREATE OR REPLACE FUNCTION public.on_echo_deleted()
RETURNS TRIGGER AS $$
DECLARE
    file_path TEXT;
BEGIN
    file_path := public.extract_storage_path(OLD.media_url, 'echoes');
    IF file_path IS NOT NULL THEN
        DELETE FROM storage.objects WHERE bucket_id = 'echoes' AND name = file_path;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_echo_deleted
AFTER DELETE ON public.echoes
FOR EACH ROW
EXECUTE FUNCTION public.on_echo_deleted();


-- 4. Triggers for attachments table
CREATE OR REPLACE FUNCTION public.on_attachment_deleted()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.storage_path IS NOT NULL THEN
        DELETE FROM storage.objects WHERE bucket_id = 'attachments' AND name = OLD.storage_path;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_attachment_deleted
AFTER DELETE ON public.attachments
FOR EACH ROW
EXECUTE FUNCTION public.on_attachment_deleted();
