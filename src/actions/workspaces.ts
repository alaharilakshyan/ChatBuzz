'use server'

import { createClient } from '@/utils/supabase/server'

export async function createWorkspaceAction(name: string) {
  if (!name || name.trim() === '') {
    return { error: 'Workspace name is required' }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Call the atomic postgres RPC function
  const { data: workspaceId, error } = await supabase.rpc('create_workspace', {
    workspace_name: name.trim(),
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, workspaceId }
}
