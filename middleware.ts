// FILE: middleware.ts
// Minimal middleware — no auth enforcement here.
// Each page checks its own session via supabase.auth.getUser().
// The login page redirects to /dashboard after SIGNED_IN.
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Only one rule: if already authenticated (any cookie), skip the login page
  const isLoginPage   = req.nextUrl.pathname === '/login'
  const hasSession    = req.cookies.get('cf_session')?.value === '1'
    || req.cookies.get('demo_bypass')?.value === 'true'
    || req.cookies.getAll().some(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))

  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Everything else passes through — pages do their own auth guard
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}