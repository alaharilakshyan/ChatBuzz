'use server'

import { createClient } from '@/utils/supabase/server'

export async function sendFriendRequestAction(usernameOrTag: string) {
  if (!usernameOrTag || usernameOrTag.trim() === '') {
    return { error: 'Please enter a username or 4-digit tag.' }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  let query = supabase.from('profiles').select('id, username, user_tag').is('deleted_at', null)

  const input = usernameOrTag.trim()
  
  if (input.includes('#')) {
    const parts = input.split('#')
    const name = parts[0].trim()
    const tag = parts[1].trim()
    query = query.ilike('username', name).eq('user_tag', tag)
  } else if (/^\d{4}$/.test(input)) {
    query = query.eq('user_tag', input)
  } else {
    query = query.ilike('username', input)
  }

  const { data: matchedProfiles, error: fetchErr } = await query
  if (fetchErr) return { error: fetchErr.message }

  if (!matchedProfiles || matchedProfiles.length === 0) {
    return { error: 'User not found.' }
  }

  const targetUser = matchedProfiles[0]

  if (targetUser.id === user.id) {
    return { error: 'You cannot add yourself as a friend.' }
  }

  // Check if they are already friends
  const { data: existingFriendship } = await supabase
    .from('friendships')
    .select('id')
    .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetUser.id}),and(user1_id.eq.${targetUser.id},user2_id.eq.${user.id})`)
    .is('deleted_at', null)
    .maybeSingle()

  if (existingFriendship) {
    return { error: 'You are already friends with this user.' }
  }

  // Check if a request is already pending
  const { data: existingRequest } = await supabase
    .from('friend_requests')
    .select('id, status, requester_id')
    .or(`and(requester_id.eq.${user.id},recipient_id.eq.${targetUser.id}),and(requester_id.eq.${targetUser.id},recipient_id.eq.${user.id})`)
    .is('deleted_at', null)
    .maybeSingle()

  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      if (existingRequest.requester_id === user.id) {
        return { error: 'Friend request already sent.' }
      } else {
        return { error: 'This user has already sent you a friend request. Check your pending requests.' }
      }
    }
  }

  // Insert friend request
  const { error: insertErr } = await supabase
    .from('friend_requests')
    .insert({
      requester_id: user.id,
      recipient_id: targetUser.id,
      status: 'pending',
      created_by: user.id
    })

  if (insertErr) return { error: insertErr.message }

  return { success: true, username: targetUser.username }
}

export async function handleFriendRequestAction(requestId: string, action: 'accept' | 'reject' | 'cancel') {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (action === 'accept') {
    // Call accept RPC
    const { error } = await supabase.rpc('accept_friend_request', {
      request_id: requestId
    })
    if (error) return { error: error.message }
    return { success: true }
  }

  if (action === 'reject') {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected', deleted_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', requestId)
      .eq('recipient_id', user.id)

    if (error) return { error: error.message }
    return { success: true }
  }

  if (action === 'cancel') {
    const { error } = await supabase
      .from('friend_requests')
      .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', requestId)
      .eq('requester_id', user.id)

    if (error) return { error: error.message }
    return { success: true }
  }

  return { error: 'Invalid action' }
}

export async function removeFriendAction(friendId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('friendships')
    .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
    .or(`and(user1_id.eq.${user.id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${user.id})`)

  if (error) return { error: error.message }
  return { success: true }
}

export async function blockUserAction(targetUserId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.rpc('block_user', {
    target_user_id: targetUserId
  })

  if (error) return { error: error.message }
  return { success: true }
}
