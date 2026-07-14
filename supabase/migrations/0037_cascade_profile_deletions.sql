-- Migration 0037: Cascade Profile Deletions
-- Re-configures foreign key constraints on messages, workspaces, and moderation actions to cascade on user profile deletions.

-- 1. Cascade profile deletion to messages (sender_id and receiver_id)
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_receiver_id_fkey 
    FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Cascade profile deletion to workspaces (owner_id)
ALTER TABLE public.workspaces DROP CONSTRAINT IF EXISTS workspaces_owner_id_fkey;
ALTER TABLE public.workspaces ADD CONSTRAINT workspaces_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Cascade profile deletion to moderation_actions (moderator_id)
ALTER TABLE public.moderation_actions DROP CONSTRAINT IF EXISTS moderation_actions_moderator_id_fkey;
ALTER TABLE public.moderation_actions ADD CONSTRAINT moderation_actions_moderator_id_fkey 
    FOREIGN KEY (moderator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
