import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Herkese açık sayfalar
const PUBLIC_PATHS = ['/auth', '/auth/register', '/auth/forgot-password'];

// Kimlik doğrulama gerektiren sayfalar
const PROTECTED_PATHS = ['/dashboard', '/root'];

export function middleware(request: NextRequest) {
  

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/root/:path*',
    '/auth',
    '/auth/register',
    '/auth/forgot-password'
  ],
} 