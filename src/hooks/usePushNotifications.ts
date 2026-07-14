'use client'

import { useEffect, useState } from 'react'
import { saveSubscriptionAction } from '@/actions/push'

// Helper function to decode public VAPID key base64 for PushManager
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window
      setIsSupported(isPushSupported)
      if (isPushSupported) {
        setPermission(Notification.permission)
        
        // Auto-check if already active
        navigator.serviceWorker.ready.then(async (reg) => {
          const sub = await reg.pushManager.getSubscription()
          setIsSubscribed(!!sub)
        }).catch(err => console.warn(err))
      }
    }
  }, [])

  const subscribeToPush = async () => {
    if (!isSupported) return { error: 'Push notifications not supported by browser.' }

    try {
      // 1. Request OS Permission
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        return { error: 'OS Notification permission was denied.' }
      }

      // 2. Fetch service worker registration
      const registration = await navigator.serviceWorker.ready
      if (!registration) {
        return { error: 'Active service worker registration not found.' }
      }

      // 3. Parse VAPID public key
      const rawVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_KEY
      const vapidPublicKey = rawVapidKey?.trim()
      if (!vapidPublicKey) {
        throw new Error('VAPID public key credentials missing.')
      }

      // 4. Create PushManager Subscription
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })

      // 5. Extract encryption credentials keys
      const p256dh = subscription.getKey('p256dh')
      const auth = subscription.getKey('auth')

      if (!p256dh || !auth) {
        throw new Error('Push subscription keys missing.')
      }

      const p256dhString = btoa(String.fromCharCode(...new Uint8Array(p256dh)))
      const authString = btoa(String.fromCharCode(...new Uint8Array(auth)))

      // 6. Save in Postgres
      const result = await saveSubscriptionAction(
        subscription.endpoint,
        p256dhString,
        authString
      )

      if (result.error) throw new Error(result.error)

      setIsSubscribed(true)
      console.log('✅ Web Push subscription successfully saved.')
      return { success: true }
    } catch (err: any) {
      console.error("[Push Notification Subscription]", {
        error: err.message || err,
        timestamp: new Date().toISOString()
      })
      return { error: err.message }
    }
  }

  return {
    isSupported,
    permission,
    isSubscribed,
    subscribeToPush,
  }
}
