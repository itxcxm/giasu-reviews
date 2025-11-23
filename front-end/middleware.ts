import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Middleware tối ưu cho Vercel Edge Runtime
 * Chạy trên Edge để tối ưu performance
 * 
 * Xác thực JWT token trong cookies trước khi cho phép truy cập các route protected.
 * Nếu không đọc được cookies (cross-domain), sẽ để AdminGuard xử lý ở client-side.
 */

// JWT Secret để verify token - phải giống với backend
const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? null : 'your-super-secret-jwt-key-change-this-in-production');

// Cảnh báo nếu thiếu JWT_SECRET trong production
if (isProduction && !JWT_SECRET) {
  console.warn(
    '⚠️ CẢNH BÁO: JWT_SECRET chưa được thiết lập ở môi trường production. ' +
    'Vui lòng bổ sung JWT_SECRET vào biến môi trường của Vercel để giống với backend.'
  );
}

// Mã hóa secret dùng cho jwtVerify
const getSecret = () => {
  if (!JWT_SECRET) return null;
  return new TextEncoder().encode(JWT_SECRET);
};

/**
 * Verify JWT token
 */
async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = getSecret();
    if (!secret) {
      // Không có secret, không thể verify
      return false;
    }
    
    await jwtVerify(token, secret);
    return true;
  } catch (error) {
    // Token không hợp lệ, hết hạn, hoặc lỗi khác
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Lấy accessToken và refreshToken từ cookies (Edge runtime compatible)
  // LƯU Ý: Trong cross-domain, có thể không đọc được cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const hasAuthToken = !!(accessToken || refreshToken);

  // Xử lý route /login
  if (pathname === '/login') {
    // Trong production cross-domain, cookies có thể không đọc được
    // Nếu có accessToken và có thể verify được, redirect về admin
    // Nếu không verify được, vẫn cho phép truy cập login page (client-side sẽ xử lý)
    const secret = getSecret();
    if (accessToken && secret) {
      try {
        const isValid = await verifyToken(accessToken);
        if (isValid) {
          // Token hợp lệ, redirect về admin
          return NextResponse.redirect(new URL('/admin', request.url));
        }
      } catch (error) {
        // Token không hợp lệ hoặc lỗi verify, cho phép truy cập login page
        // Client-side sẽ xử lý check auth
      }
    }
    // Không có token, không có secret, hoặc token không hợp lệ: cho phép truy cập login page
    return NextResponse.next();
  }

  // Xử lý route /admin (protected route)
  if (pathname.startsWith('/admin')) {
    // Kiểm tra xem có token không
    if (!hasAuthToken) {
      // Không có token, redirect về login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Có token, verify JWT
    if (accessToken) {
      const isValid = await verifyToken(accessToken);
      if (isValid) {
        // Token hợp lệ, cho phép truy cập
        return NextResponse.next();
      }
      // Token không hợp lệ hoặc hết hạn
      // Nếu có refreshToken, vẫn cho phép (AdminGuard sẽ xử lý refresh)
      if (refreshToken) {
        return NextResponse.next();
      }
      // Không có refreshToken, redirect về login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Chỉ có refreshToken, không có accessToken
    // Cho phép truy cập, AdminGuard sẽ xử lý refresh token
    if (refreshToken) {
      return NextResponse.next();
    }

    // Không có token nào, redirect về login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
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