-- Migration 0025: Reload API Schema
-- Triggers a PostgREST and Storage API schema cache reload to fix platform-level 503 cache mismatch errors.

NOTIFY pgrst, 'reload schema';
