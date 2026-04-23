import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // If user is not authenticated and trying to access dashboard, redirect to login
  if (!token && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and trying to access login, redirect to dashboard
  if (token && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login/:path*'],
};
