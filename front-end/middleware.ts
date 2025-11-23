import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware tối ưu cho Vercel Edge Runtime
 * Chạy trên Edge để tối ưu performance
 * 
 * Xác thực bằng cách call API /api/admin/check-auth của backend.
 * Nếu API trả về authenticated: true thì cho phép truy cập.
 */

// Lấy API URL từ environment variable
const getApiBaseUrl = (): string => {
  const isProduction = process.env.NODE_ENV === 'production';
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  
  if (publicApiUrl) {
    if (publicApiUrl.startsWith('http://') || publicApiUrl.startsWith('https://')) {
      return publicApiUrl;
    }
    if (isProduction) {
      return `https://${publicApiUrl}`;
    }
    return `http://${publicApiUrl}`;
  }
  
  if (isProduction) {
    return '';
  }
  
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Call API check-auth của backend để verify authentication
 */
async function checkAuthFromAPI(request: NextRequest): Promise<boolean> {
  try {
    // Lấy cookies từ request
    const cookies = request.cookies.getAll();
    const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    
    // Lấy origin từ request để gửi trong headers (cần cho CORS)
    const origin = request.headers.get('origin') || request.nextUrl.origin;
    
    // Gọi API check-auth
    const apiUrl = `${API_BASE_URL}/api/admin/check-auth`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
        'Origin': origin,
        'Referer': request.nextUrl.toString(),
      },
      // Không dùng cache
      cache: 'no-store',
    });
    
    if (!response.ok) {
      // Nếu response không OK, có thể là lỗi server hoặc chưa đăng nhập
      return false;
    }
    
    const data = await response.json();
    
    // Kiểm tra response có authenticated: true không
    return data?.success === true && data?.authenticated === true;
  } catch (error) {
    // Lỗi khi call API (network error, timeout, etc.)
    // Trong trường hợp này, cho phép truy cập và để client-side xử lý
    console.error('Check auth API error:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Kiểm tra xem có API URL không
  if (!API_BASE_URL) {
    // Không có API URL, cho phép truy cập (sẽ xử lý ở client-side)
    return NextResponse.next();
  }

  // Xử lý route /login
  if (pathname === '/login') {
    // Call API check-auth để kiểm tra đã đăng nhập chưa
    const isAuthenticated = await checkAuthFromAPI(request);
    
    if (isAuthenticated) {
      // Đã đăng nhập, redirect về admin
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    
    // Chưa đăng nhập, cho phép truy cập login page
    return NextResponse.next();
  }

  // Xử lý route /admin (protected route)
  if (pathname.startsWith('/admin')) {
    // Call API check-auth để verify authentication
    const isAuthenticated = await checkAuthFromAPI(request);
    
    if (isAuthenticated) {
      // Đã xác thực, cho phép truy cập
      return NextResponse.next();
    }
    
    // Chưa xác thực, redirect về login
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