-- Migration 0019: Enable PostGIS and add spatial tracking columns to profiles
-- Installs the geography coordinate layers for real-time tracking.

-- 1. Enable PostGIS extension in public schema
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA public;

-- 2. Add spatial columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_location public.geography(POINT, 4326),
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE;
