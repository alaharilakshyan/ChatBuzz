'use server'

import { fetchServer } from '@/lib/api/server'

export async function createWorkspaceAction(name: string) {
  if (!name || name.trim() === '') {
    return { error: 'Workspace name is required' }
  }

  try {
    const workspace = await fetchServer('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() })
    });
    return { success: true, workspaceId: workspace._id || workspace.id }
  } catch (err: any) {
    console.error('CreateWorkspaceAction failure:', err)
    return { error: err.message || 'Workspace creation failed.' }
  }
}
