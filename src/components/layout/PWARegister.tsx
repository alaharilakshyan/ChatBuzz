'use client'

import { useEffect } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export const PWARegister = () => {
  const { subscribeToPush } = usePushNotifications()

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 PWA: Disabling and clearing service workers/caches in development mode...');
      if (typeof window !== 'undefined') {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
              registration.unregister().then((success) => {
                if (success) {
                  console.log('✅ Programmatically unregistered service worker:', registration.scope);
                }
              });
            }
          }).catch((err) => console.warn('Failed to unregister PWA worker:', err));
        }
        if ('caches' in window) {
          caches.keys().then((keys) => {
            Promise.all(keys.map((key) => caches.delete(key))).then(() => {
              console.log('✅ Programmatically deleted PWA caches');
            });
          }).catch((err) => console.warn('Failed to clear PWA caches:', err));
        }
      }
      return
    }
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
