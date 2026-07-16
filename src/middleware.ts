import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('chatbuzz_token')?.value
  const { pathname } = request.nextUrl

  // Define public paths
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password')
  const isPublicApi = pathname.startsWith('/api/')
  const isStaticFile = pathname.startsWith('/manifest.json') || pathname.startsWith('/sw.js') || pathname.startsWith('/favicon.ico') || pathname.startsWith('/uploads/')

  if (isPublicApi || isStaticFile) {
    return NextResponse.next()
  }

  if (!token && !isAuthPage) {
    // Redirect to login if unauthenticated
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (token && isAuthPage) {
    // Redirect to dashboard if already authenticated
    const dashboardUrl = new URL('/', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
