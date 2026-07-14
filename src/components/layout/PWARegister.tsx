'use client'

import { useEffect } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export const PWARegister = () => {
  const { subscribeToPush } = usePushNotifications()

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleRegister = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
          console.log('PWA ServiceWorker registered with scope:', registration.scope)

          // Auto-prompt to subscribe if not yet configured, delaying slightly for page settle
          if ('PushManager' in window && Notification.permission === 'default') {
            setTimeout(() => {
              subscribeToPush().catch((err) => console.warn(err))
            }, 3000)
          }
        } catch (err) {
          console.error('PWA ServiceWorker registration failed:', err)
        }
      }

      // Check load status to prevent blocking layout rendering
      if (document.readyState === 'complete') {
        handleRegister()
      } else {
        window.addEventListener('load', handleRegister)
        return () => window.removeEventListener('load', handleRegister)
      }
    }
  }, [subscribeToPush])

  return null
}
export default PWARegister
