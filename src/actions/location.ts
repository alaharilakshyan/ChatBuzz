'use server'

import { createClient } from '@/utils/supabase/server'

export async function updateLocationAction(lat: number, lng: number) {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { error: 'Invalid coordinates' }
  }

  // Validate coordinates boundaries
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { error: 'Coordinates out of bounds' }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  // WKT (Well-Known Text) formatting is POINT(longitude latitude)
  const wktPoint = `POINT(${lng} ${lat})`

  const { error } = await supabase
    .from('profiles')
    .update({
      last_location: wktPoint,
      last_location_update: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function clearLocationAction() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('profiles')
    .update({
      last_location: null,
      last_location_update: null
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
