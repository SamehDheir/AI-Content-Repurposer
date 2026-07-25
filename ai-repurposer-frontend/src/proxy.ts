import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Gate on the refresh cookie, not the access cookie: the access token expires
  // after ~15 minutes and the client silently refreshes it, so treating its
  // absence as "logged out" would bounce active users to the login page.
  // Both are HttpOnly, which is readable here because this runs server-side.
  const session = request.cookies.get('refreshToken')?.value;
  const { pathname } = request.nextUrl;

  // If user is not authenticated and trying to access dashboard, redirect to login
  if (!session && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and trying to access login, redirect to dashboard
  if (session && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login/:path*'],
};
