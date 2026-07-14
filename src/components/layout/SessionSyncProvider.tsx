'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface SessionSyncProviderProps {
  children: React.ReactNode
}

export function SessionSyncProvider({ children }: SessionSyncProviderProps) {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Listen to Supabase authentication transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
      if (event === 'SIGNED_OUT') {
        console.log('🔄 Tab SessionSync: User signed out. Redirecting to login page...')
        // Reset client page data and force redirect
        router.push('/login')
        router.refresh()
      } else if (event === 'SIGNED_IN') {
        console.log('🔄 Tab SessionSync: User signed in. Refreshing pages...')
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  return <>{children}</>
}
