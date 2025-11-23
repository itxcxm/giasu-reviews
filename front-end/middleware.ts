import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware tối ưu cho Vercel Edge Runtime
 * Chạy trên Edge để tối ưu performance
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Lấy accessToken từ cookies (Edge runtime compatible)
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const hasAuthToken = !!(accessToken || refreshToken);

  // Bảo vệ routes /admin - chỉ cho phép nếu có token
  if (pathname.startsWith('/admin')) {
    if (!hasAuthToken) {
      // Không có token, redirect về login
      const loginUrl = new URL('/login', request.url);
      // Lưu URL hiện tại để redirect lại sau khi login
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Có token, cho phép truy cập (AdminGuard sẽ kiểm tra tính hợp lệ)
    return NextResponse.next();
  }

  // Nếu đã đăng nhập, không cho phép truy cập /login
  if (pathname === '/login' && hasAuthToken) {
    // Đã có token, redirect về admin dashboard
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Cho phép truy cập các routes khác
  return NextResponse.next();
}

// Cấu hình matcher để middleware chỉ chạy cho các routes cụ thể
// Tối ưu performance bằng cách không chạy cho tất cả routes
export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
  ],
};

