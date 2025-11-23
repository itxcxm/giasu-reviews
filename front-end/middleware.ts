import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Tự động lấy cookie token (token, access_token, admin_token...)
function getTokenCookie(request: NextRequest): string | null {
  const tokenCookie = request.cookies
    .getAll()
    .find((cookie) => cookie.name.toLowerCase().includes('token'));

  return tokenCookie?.value || null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lấy token từ cookie
  const token = getTokenCookie(request);

  // === LOGIN PAGE ===
  if (pathname === '/login') {
    // Nếu đã có token → redirect admin
    if (token) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // === ADMIN PAGE (protected) ===
  if (pathname.startsWith('/admin')) {
    if (!token) {
      // Không có token → redirect login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Có token → cho vào admin
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
