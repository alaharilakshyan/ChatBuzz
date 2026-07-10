-- Migration 0010: Database Functions and Event Triggers
-- Defines business logic, automations, and trigger handlers.

-- 1. Helper to generate unique 4-digit user tag
CREATE OR REPLACE FUNCTION public.generate_user_tag()
RETURNS TEXT AS $$
DECLARE
    new_tag TEXT;
    tag_exists BOOLEAN;
BEGIN
    LOOP
        new_tag := lpad(floor(random() * 10000)::text, 4, '0');
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_tag = new_tag AND deleted_at IS NULL) INTO tag_exists;
        EXIT WHEN NOT tag_exists;
    END LOOP;
    RETURN new_tag;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger function to initialize profiles and presence on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    username_val TEXT;
    tag_val TEXT;
BEGIN
    username_val := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
    tag_val := public.generate_user_tag();

    -- Insert into profiles
    INSERT INTO public.profiles (id, username, user_tag, created_by)
    VALUES (new.id, username_val, tag_val, new.id);

    -- Insert initial offline presence record
    INSERT INTO public.presence (user_id, status, created_by)
    VALUES (new.id, 'offline'::public.presence_status, new.id);

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind handle_new_user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. RPC: accept_friend_request(request_id uuid)
CREATE OR REPLACE FUNCTION public.accept_friend_request(request_id UUID)
RETURNS VOID AS $$
DECLARE
    req_row public.friend_requests%ROWTYPE;
    user1_uuid UUID;
    user2_uuid UUID;
    friendship_uuid UUID;
BEGIN
    -- Query the request
    SELECT * INTO req_row FROM public.friend_requests 
    WHERE id = request_id AND recipient_id = auth.uid() AND status = 'pending' AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Friend request not found or unauthorized';
    END IF;

    -- Update request status
    UPDATE public.friend_requests 
    SET status = 'accepted'::public.friend_request_status, updated_at = now(), updated_by = auth.uid()
    WHERE id = request_id;

    -- Order user IDs for friendships constraint (user1_id < user2_id)
    IF req_row.requester_id < req_row.recipient_id THEN
        user1_uuid := req_row.requester_id;
        user2_uuid := req_row.recipient_id;
    ELSE
        user1_uuid := req_row.recipient_id;
        user2_uuid := req_row.requester_id;
    END IF;

    -- Insert friendship record
    INSERT INTO public.friendships (user1_id, user2_id, created_by)
    VALUES (user1_uuid, user2_uuid, auth.uid())
    ON CONFLICT (user1_id, user2_id) DO UPDATE 
    SET deleted_at = NULL, updated_at = now(), updated_by = auth.uid()
    RETURNING id INTO friendship_uuid;

    -- Dispatch notification
    INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id, created_by)
    VALUES (
        req_row.requester_id,
        'friend_accept',
        'Friend Request Accepted',
        'Your friend request was accepted by ' || (SELECT username FROM public.profiles WHERE id = auth.uid()),
        'friendships',
        friendship_uuid,
        auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: leave_workspace(workspace_id uuid)
CREATE OR REPLACE FUNCTION public.leave_workspace(workspace_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_owner BOOLEAN;
    next_owner_id UUID;
    is_deleted BOOLEAN := false;
BEGIN
    -- Verify membership
    IF NOT EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_id = workspace_id_param AND user_id = auth.uid() AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'You are not a member of this workspace';
    END IF;

    -- Check if user is workspace owner
    SELECT (owner_id = auth.uid()) INTO is_owner FROM public.workspaces WHERE id = workspace_id_param;

    IF is_owner THEN
        -- Find the next senior admin or member to take ownership
        SELECT user_id INTO next_owner_id 
        FROM public.workspace_members 
        WHERE workspace_id = workspace_id_param AND user_id <> auth.uid() AND deleted_at IS NULL
        ORDER BY created_at ASC LIMIT 1;

        IF next_owner_id IS NOT NULL THEN
            -- Reassign ownership
            UPDATE public.workspaces 
            SET owner_id = next_owner_id, updated_at = now(), updated_by = auth.uid()
            WHERE id = workspace_id_param;
        ELSE
            -- Soft-delete workspace and its sub-elements
            UPDATE public.workspaces 
            SET deleted_at = now(), updated_at = now(), updated_by = auth.uid() 
            WHERE id = workspace_id_param;

            UPDATE public.channels 
            SET deleted_at = now(), updated_at = now(), updated_by = auth.uid()
            WHERE workspace_id = workspace_id_param;

            UPDATE public.workspace_members 
            SET deleted_at = now(), updated_at = now(), updated_by = auth.uid()
            WHERE workspace_id = workspace_id_param;

            is_deleted := true;
        END IF;
    END IF;

    -- Remove user membership
    IF NOT is_deleted THEN
        UPDATE public.workspace_members 
        SET deleted_at = now(), updated_at = now(), updated_by = auth.uid()
        WHERE workspace_id = workspace_id_param AND user_id = auth.uid();
        
        -- Clean up private channel memberships
        UPDATE public.channel_members 
        SET deleted_at = now(), updated_at = now(), updated_by = auth.uid()
        WHERE channel_id IN (SELECT id FROM public.channels WHERE workspace_id = workspace_id_param) AND user_id = auth.uid();
    END IF;

    RETURN is_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: mark_messages_read(target_channel_id uuid, target_receiver_id uuid, before_timestamp timestamptz)
CREATE OR REPLACE FUNCTION public.mark_messages_read(
    target_channel_id UUID,
    target_receiver_id UUID,
    before_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER := 0;
BEGIN
    IF target_channel_id IS NOT NULL THEN
        -- Mark channel messages as read
        INSERT INTO public.message_reads (message_id, user_id, read_at, created_by)
        SELECT m.id, auth.uid(), now(), auth.uid()
        FROM public.messages m
        WHERE m.channel_id = target_channel_id
          AND m.created_at <= before_timestamp
          AND m.sender_id <> auth.uid()
          AND m.deleted_at IS NULL
        ON CONFLICT (message_id, user_id) DO UPDATE
        SET read_at = now(), updated_at = now()
        RETURNING 1 INTO affected_rows;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
    ELSIF target_receiver_id IS NOT NULL THEN
        -- Mark direct messages as read
        INSERT INTO public.message_reads (message_id, user_id, read_at, created_by)
        SELECT m.id, auth.uid(), now(), auth.uid()
        FROM public.messages m
        WHERE m.sender_id = target_receiver_id
          AND m.receiver_id = auth.uid()
          AND m.created_at <= before_timestamp
          AND m.deleted_at IS NULL
        ON CONFLICT (message_id, user_id) DO UPDATE
        SET read_at = now(), updated_at = now();
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
    END IF;

    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: block_user(target_user_id uuid)
CREATE OR REPLACE FUNCTION public.block_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'You cannot block yourself';
    END IF;

    -- Log the block
    INSERT INTO public.blocks (blocker_id, blocked_id, created_by)
    VALUES (auth.uid(), target_user_id, auth.uid())
    ON CONFLICT (blocker_id, blocked_id) DO UPDATE
    SET deleted_at = NULL, updated_at = now(), updated_by = auth.uid();

    -- Break friendship
    UPDATE public.friendships 
    SET deleted_at = now(), updated_at = now(), updated_by = auth.uid()
    WHERE ((user1_id = auth.uid() AND user2_id = target_user_id) OR (user1_id = target_user_id AND user2_id = auth.uid()))
      AND deleted_at IS NULL;

    -- Reject/cancel any pending requests
    UPDATE public.friend_requests 
    SET status = 'rejected'::public.friend_request_status, deleted_at = now(), updated_at = now(), updated_by = auth.uid()
    WHERE ((requester_id = auth.uid() AND recipient_id = target_user_id) OR (requester_id = target_user_id AND recipient_id = auth.uid()))
      AND status = 'pending'::public.friend_request_status AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
