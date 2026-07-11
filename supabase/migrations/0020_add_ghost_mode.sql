-- Migration 0020: Add ghost_mode_enabled to user_settings table
-- Adds the boolean flag required to toggle spatial tracking broadcasts.

ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS ghost_mode_enabled BOOLEAN NOT NULL DEFAULT false;
