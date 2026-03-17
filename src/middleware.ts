import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-for-local-dev-only-change-in-prod'
);

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  // Protect all routes except /login, /api/auth, and static files
  if (
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/api/auth') &&
    !request.nextUrl.pathname.startsWith('/_next') &&
    !request.nextUrl.pathname.includes('.')
  ) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      await jwtVerify(session, SECRET_KEY);
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If logged in and trying to access /login, redirect to /
  if (request.nextUrl.pathname.startsWith('/login') && session) {
    try {
      await jwtVerify(session, SECRET_KEY);
      return NextResponse.redirect(new URL('/', request.url));
    } catch (error) {
      // Invalid session, let them access /login
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
