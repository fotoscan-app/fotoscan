import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, COOKIE } from '@/lib/auth'

const PROTECTED = ['/dashboard']
const AUTH_ONLY = ['/login', '/register']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(COOKIE)?.value

  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  const isAuthOnly  = AUTH_ONLY.some(p => pathname.startsWith(p))

  if (isProtected) {
    if (!token) return NextResponse.redirect(new URL('/login', req.url))
    const payload = await verifyToken(token)
    if (!payload) {
      const res = NextResponse.redirect(new URL('/login', req.url))
      res.cookies.delete(COOKIE)
      return res
    }
  }

  if (isAuthOnly && token) {
    const payload = await verifyToken(token)
    if (payload) return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
