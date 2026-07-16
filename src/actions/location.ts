'use server'

import { fetchServer } from '@/lib/api/server'

export async function updateLocationAction(lat: number, lng: number) {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { error: 'Invalid coordinates' }
  }

  // Validate coordinates boundaries
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { error: 'Coordinates out of bounds' }
  }

  try {
    await fetchServer('/users/location', {
      method: 'PATCH',
      body: JSON.stringify({ latitude: lat, longitude: lng })
    });
    return { success: true }
  } catch (err: any) {
    console.error('UpdateLocationAction failure:', err)
    return { error: err.message || 'Location update failed.' }
  }
}

export async function clearLocationAction() {
  try {
    await fetchServer('/users/location', {
      method: 'PATCH',
      body: JSON.stringify({ latitude: null, longitude: null })
    });
    return { success: true }
  } catch (err: any) {
    console.error('ClearLocationAction failure:', err)
    return { error: err.message || 'Location clear failed.' }
  }
}
