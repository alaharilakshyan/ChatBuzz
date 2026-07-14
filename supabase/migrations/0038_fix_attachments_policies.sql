-- Migration 0038: Fix Attachments Policies Shadowing
-- Re-creates attachments policies with qualified storage.objects.name references to prevent shadowing from channels.name.

DROP POLICY IF EXISTS "attachments_select" ON storage.objects;
DROP POLICY IF EXISTS "attachments_insert" ON storage.objects;
DROP POLICY IF EXISTS "attachments_update" ON storage.objects;
DROP POLICY IF EXISTS "attachments_delete" ON storage.objects;

CREATE POLICY "attachments_select" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'attachments' AND auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.channels AS ch
                WHERE ch.id::text = (storage.foldername(storage.objects.name))[1]
                AND public.is_workspace_member(ch.workspace_id, auth.uid())
                AND (ch.is_private = false OR public.is_channel_member(ch.id, auth.uid()))
            )
            OR
            EXISTS (
                SELECT 1 FROM public.profiles AS p
                WHERE p.id::text = (storage.foldername(storage.objects.name))[1]
                AND (
                    p.id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.friendships
                        WHERE (
                            (user1_id = auth.uid() AND user2_id = p.id) OR
                            (user2_id = auth.uid() AND user1_id = p.id)
                        ) AND deleted_at IS NULL
                    )
                )
            )
        )
    );

CREATE POLICY "attachments_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'attachments' AND auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.channels AS ch
                WHERE ch.id::text = (storage.foldername(storage.objects.name))[1]
                AND public.is_workspace_member(ch.workspace_id, auth.uid())
                AND (ch.is_private = false OR public.is_channel_member(ch.id, auth.uid()))
            )
            OR
            EXISTS (
                SELECT 1 FROM public.profiles AS p
                WHERE p.id::text = (storage.foldername(storage.objects.name))[1]
                AND (
                    p.id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.friendships
                        WHERE (
                            (user1_id = auth.uid() AND user2_id = p.id) OR
                            (user2_id = auth.uid() AND user1_id = p.id)
                        ) AND deleted_at IS NULL
                    )
                )
            )
        )
    );

CREATE POLICY "attachments_update" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'attachments' AND auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.channels AS ch
                WHERE ch.id::text = (storage.foldername(storage.objects.name))[1]
                AND public.is_workspace_member(ch.workspace_id, auth.uid())
                AND (ch.is_private = false OR public.is_channel_member(ch.id, auth.uid()))
            )
            OR
            EXISTS (
                SELECT 1 FROM public.profiles AS p
                WHERE p.id::text = (storage.foldername(storage.objects.name))[1]
                AND (
                    p.id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.friendships
                        WHERE (
                            (user1_id = auth.uid() AND user2_id = p.id) OR
                            (user2_id = auth.uid() AND user1_id = p.id)
                        ) AND deleted_at IS NULL
                    )
                )
            )
        )
    );

CREATE POLICY "attachments_delete" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'attachments' AND auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.channels AS ch
                WHERE ch.id::text = (storage.foldername(storage.objects.name))[1]
                AND public.is_workspace_member(ch.workspace_id, auth.uid())
                AND (ch.is_private = false OR public.is_channel_member(ch.id, auth.uid()))
            )
            OR
            EXISTS (
                SELECT 1 FROM public.profiles AS p
                WHERE p.id::text = (storage.foldername(storage.objects.name))[1]
                AND (
                    p.id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.friendships
                        WHERE (
                            (user1_id = auth.uid() AND user2_id = p.id) OR
                            (user2_id = auth.uid() AND user1_id = p.id)
                        ) AND deleted_at IS NULL
                    )
                )
            )
        )
    );
