import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard']
const AUTH_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password']

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page))

  // Read the session cookie set by Better Auth
  const session = req.cookies.get('better-auth.session_token')

  if (isProtected && !session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|q/).*)',
  ],
}
