import { NextRequest, NextResponse } from 'next/server'

// ─────────────────────────────────────────────
// Route Protection Proxy (Next.js 16 convention)
// ─────────────────────────────────────────────
// This is the FIRST line of defense. It is NOT the sole security boundary.
// Every API route also performs server-side auth via getCurrentUserAndOrg().

/** Routes that are always publicly accessible (exact match) */
const PUBLIC_PATHS = ['/', '/pricing', '/login', '/signup', '/forgot-password', '/reset-password', '/accept-invite', '/verify-email']

/** Auth pages — redirect to dashboard if already logged in */
const AUTH_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email']

/** Path prefixes that are always publicly accessible */
const PUBLIC_PREFIXES = [
  '/q/',              // QR redirect (public hot path)
  '/api/auth/',       // better-auth endpoints
  '/api/webhooks/',   // Payment provider webhooks (verify signatures inside)
  '/api/cron/',       // Cron jobs (verify secret inside)
  '/api/billing/plans', // Public plans list for pricing page
]

/** Protected path prefixes — require authentication */
const PROTECTED_PREFIXES = ['/dashboard', '/api/']

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true
  }
  return false
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((page) => pathname.startsWith(page))
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Check for better-auth session cookie
  const sessionToken =
    req.cookies.get('better-auth.session_token')?.value ||
    req.cookies.get('__Secure-better-auth.session_token')?.value

  // Redirect authenticated users away from auth pages
  if (isAuthPage(pathname) && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Allow public paths through
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Protected routes — require session cookie
  if (isProtectedPath(pathname) && !sessionToken) {
    // API routes → 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
        },
        { status: 401 }
      )
    }

    // Dashboard/app routes → redirect to login
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
