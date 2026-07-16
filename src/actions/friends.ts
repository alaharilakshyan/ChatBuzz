'use server'

import { fetchServer } from '@/lib/api/server'

export async function sendFriendRequestAction(usernameOrTag: string) {
  if (!usernameOrTag || usernameOrTag.trim() === '') {
    return { error: 'Please enter a username or 4-digit tag.' }
  }

  try {
    const result = await fetchServer('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ targetTag: usernameOrTag.trim() })
    });
    return { success: true, username: usernameOrTag }
  } catch (err: any) {
    console.error('SendFriendRequestAction failure:', err)
    return { error: err.message || 'Friend request failed.' }
  }
}

export async function handleFriendRequestAction(requestId: string, action: 'accept' | 'reject' | 'cancel') {
  try {
    if (action === 'accept') {
      await fetchServer(`/friends/request/${requestId}/accept`, { method: 'POST' });
    } else if (action === 'reject') {
      await fetchServer(`/friends/request/${requestId}/reject`, { method: 'POST' });
    } else if (action === 'cancel') {
      await fetchServer(`/friends/request/${requestId}/cancel`, { method: 'POST' });
    }
    return { success: true }
  } catch (err: any) {
    console.error('HandleFriendRequestAction failure:', err)
    return { error: err.message || 'Friend request operation failed.' }
  }
}

export async function removeFriendAction(friendId: string) {
  try {
    await fetchServer(`/friends/${friendId}`, { method: 'DELETE' });
    return { success: true }
  } catch (err: any) {
    console.error('RemoveFriendAction failure:', err)
    return { error: err.message || 'Failed to remove friend.' }
  }
}

export async function blockUserAction(targetUserId: string) {
  try {
    await fetchServer(`/friends/block/${targetUserId}`, { method: 'POST' });
    return { success: true }
  } catch (err: any) {
    console.error('BlockUserAction failure:', err)
    return { error: err.message || 'Failed to block user.' }
  }
}
