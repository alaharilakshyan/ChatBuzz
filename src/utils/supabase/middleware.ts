import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session cookie if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  
  // Protect chats, profile, settings, friends, calls, workspaces routes
  const isProtectedPath = 
    path.startsWith('/chat') || 
    path.startsWith('/workspaces') || 
    path.startsWith('/profile') || 
    path.startsWith('/settings') || 
    path.startsWith('/friends') || 
    path.startsWith('/calls') ||
    path.startsWith('/map')
  const isAuthPath = path === '/login' || path === '/register' || path === '/forgot-password'

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirectResponse = NextResponse.redirect(url)
    // Copy cookies from supabaseResponse to ensure session state changes are preserved
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        httpOnly: cookie.httpOnly,
      })
    })
    return redirectResponse
  }

  if (user && isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/chat'
    const redirectResponse = NextResponse.redirect(url)
    // Copy cookies from supabaseResponse to ensure session state changes are preserved
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        httpOnly: cookie.httpOnly,
      })
    })
    return redirectResponse
  }

  return supabaseResponse
}
