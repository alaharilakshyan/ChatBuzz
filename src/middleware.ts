import { NextResponse, type NextRequest } from 'next/server'

const EXPRESS_API_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || 'http://localhost:4000/api/v1'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('chatbuzz_token')?.value
  const refreshToken = request.cookies.get('chatbuzz_refresh_token')?.value

  // Define public paths
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password')
  const isPublicApi = pathname.startsWith('/api/')
  const isStaticFile = pathname.startsWith('/manifest.json') || pathname.startsWith('/sw.js') || pathname.startsWith('/favicon.ico') || pathname.startsWith('/uploads/') || pathname.startsWith('/_vercel/')
  const isLandingPage = pathname === '/'

  if (isPublicApi || isStaticFile) {
    return NextResponse.next()
  }

  let response = NextResponse.next()
  let currentToken = token

  // 🔄 Silent Token Refresh inside Middleware (if access token is missing but refresh token exists)
  if (!token && refreshToken) {
    try {
      console.log('🔄 Middleware: Access token missing. Refreshing session...');
      const refreshResponse = await fetch(`${EXPRESS_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `chatbuzz_refresh_token=${refreshToken}`
        }
      })

      if (refreshResponse.ok) {
        const setCookies = refreshResponse.headers.getSetCookie ? refreshResponse.headers.getSetCookie() : []
        
        setCookies.forEach((cookieStr) => {
          const parts = cookieStr.split(';').map(p => p.trim())
          const [nameValue, ...attrs] = parts
          const [name, value] = nameValue.split('=')
          
          if (name === 'chatbuzz_token') {
            currentToken = value
          }

          const opts: any = { path: '/' }
          attrs.forEach(attr => {
            const [k, v] = attr.split('=')
            const key = k.toLowerCase()
            if (key === 'path') opts.path = v
            else if (key === 'max-age') opts.maxAge = parseInt(v, 10)
            else if (key === 'same-site') opts.sameSite = v.toLowerCase() as any
            else if (key === 'secure') opts.secure = true
            else if (key === 'httponly') opts.httpOnly = true
          })

          // Save to response so browser updates cookies, and save to request so Server Components see the token immediately
          response.cookies.set(name, value, opts)
          request.cookies.set(name, value)
        })
        console.log('✅ Middleware: Session refreshed successfully!')
      } else {
        console.warn('❌ Middleware: Refresh token invalid or expired. Clearing session.')
        response.cookies.delete('chatbuzz_token')
        response.cookies.delete('chatbuzz_refresh_token')
        currentToken = undefined
      }
    } catch (refreshErr) {
      console.error('Middleware silent refresh error:', refreshErr)
    }
  }

  // 🛡️ Access Control & Redirects
  if (!currentToken && !isAuthPage && !isLandingPage) {
    const loginUrl = new URL('/login', request.url)
    const redirectResponse = NextResponse.redirect(loginUrl)
    // Clear cookies if they were set/expired
    redirectResponse.cookies.delete('chatbuzz_token')
    redirectResponse.cookies.delete('chatbuzz_refresh_token')
    return redirectResponse
  }

  if (currentToken && isAuthPage) {
    const chatUrl = new URL('/chat', request.url)
    return NextResponse.redirect(chatUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js|.*\\.[\\w]+$).*)',
  ],
}
