-- Migration 0034: Secure Spatial Ref Sys Table
-- Enables Row Level Security on the PostGIS system table spatial_ref_sys to satisfy Supabase security linter.

-- 1. Enable Row Level Security on public.spatial_ref_sys
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- 2. Create public select policy (the table is a read-only metadata catalog)
CREATE POLICY "Allow public read access to spatial_ref_sys" ON public.spatial_ref_sys
    FOR SELECT TO public USING (true);
