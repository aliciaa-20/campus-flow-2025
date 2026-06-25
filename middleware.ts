// FILE: middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const isLoginPage = req.nextUrl.pathname === '/login'

  // Check any of the three valid session signals
  const demoCookie   = req.cookies.get('demo_bypass')?.value === 'true'
  const sessionCookie = req.cookies.get('cf_session')?.value === '1'
  const sbCookie     = req.cookies.getAll().some(
    c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )

  const isAuthed = demoCookie || sessionCookie || sbCookie

  if (!isAuthed && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (isAuthed && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
