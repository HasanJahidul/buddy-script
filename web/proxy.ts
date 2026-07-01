import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Next.js 16 renamed `middleware` -> `proxy`. This guards the protected /feed
// route: if the auth cookie is absent, redirect to /login. Real verification
// still happens server-side (feed page calls /auth/me) and in the API guards.
const COOKIE_NAME = 'bs_token';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/feed') && !request.cookies.has(COOKIE_NAME)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/feed/:path*'],
};
