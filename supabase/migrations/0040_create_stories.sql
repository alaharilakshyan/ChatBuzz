-- Migration 0040: Create Stories and Story Views
-- Creates stories table, story_views table, enums for media type and extension, 
-- and configures storage bucket and RLS policies for stories_media.

-- Create custom enums if they do not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
        CREATE TYPE public.media_type AS ENUM ('image', 'video');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_extension') THEN
        CREATE TYPE public.media_extension AS ENUM ('jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov');
    END IF;
END
$$;

-- Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_by UUID NOT NULL DEFAULT auth.uid(),
  media_type public.media_type NOT NULL,
  media_extension public.media_extension NOT NULL
);

-- Create story_views table
CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Stories Policies
DROP POLICY IF EXISTS "Allow users to view own and friends stories" ON public.stories;
CREATE POLICY "Allow users to view own and friends stories" ON public.stories
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.friendships
            WHERE (
                (user1_id = auth.uid() AND user2_id = user_id) OR
                (user2_id = auth.uid() AND user1_id = user_id)
            ) AND deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "Allow users to insert own stories" ON public.stories;
CREATE POLICY "Allow users to insert own stories" ON public.stories
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow users to delete own stories" ON public.stories;
CREATE POLICY "Allow users to delete own stories" ON public.stories
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Story Views Policies
DROP POLICY IF EXISTS "Allow users to view own stories views" ON public.story_views;
CREATE POLICY "Allow users to view own stories views" ON public.story_views
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.stories
            WHERE id = story_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow users to insert story views" ON public.story_views;
CREATE POLICY "Allow users to insert story views" ON public.story_views
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.stories
            WHERE id = story_id
        )
    );

-- Seed stories_media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('stories_media', 'stories_media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for stories_media bucket
DROP POLICY IF EXISTS "Allow public read from stories_media" ON storage.objects;
CREATE POLICY "Allow public read from stories_media" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'stories_media');

DROP POLICY IF EXISTS "Allow authenticated uploads to stories_media" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to stories_media" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'stories_media' AND
        starts_with(storage.objects.name, auth.uid()::text || '-')
    );

DROP POLICY IF EXISTS "Allow authenticated updates to stories_media" ON storage.objects;
CREATE POLICY "Allow authenticated updates to stories_media" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'stories_media' AND
        starts_with(storage.objects.name, auth.uid()::text || '-')
    );

DROP POLICY IF EXISTS "Allow authenticated deletes from stories_media" ON storage.objects;
CREATE POLICY "Allow authenticated deletes from stories_media" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'stories_media' AND
        starts_with(storage.objects.name, auth.uid()::text || '-')
    );
