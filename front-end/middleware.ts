import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface UserPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

function getUserFromToken(request: NextRequest): UserPayload | null {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return null;
  }
  try {
    const decoded = jwtDecode<UserPayload>(token);
    return decoded;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = getUserFromToken(request);
  const isAuthenticated = !!user;

  const authRoutes = ['/login', '/register'];
  const protectedRoutes = ['/account', '/add-center'];
  const adminRoute = '/admin';

  // Nếu đã đăng nhập, không cho phép truy cập trang login/register
  if (isAuthenticated && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Nếu chưa đăng nhập, không cho phép truy cập các trang được bảo vệ
  if (!isAuthenticated && (protectedRoutes.includes(pathname) || pathname.startsWith(adminRoute))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Xử lý riêng cho trang admin
  if (pathname.startsWith(adminRoute)) {
    // Đã qua bước kiểm tra đăng nhập ở trên, chỉ cần kiểm tra vai trò
    if (user?.role !== 'admin') {
      // Nếu không phải admin, chuyển hướng về trang chủ
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/register', '/account', '/add-center'],
};