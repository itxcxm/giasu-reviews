import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Lấy API URL từ environment variable
 */
function getApiBaseUrl(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  
  if (publicApiUrl) {
    if (publicApiUrl.startsWith('http://') || publicApiUrl.startsWith('https://')) {
      return publicApiUrl;
    }
    return isProduction ? `https://${publicApiUrl}` : `http://${publicApiUrl}`;
  }
  
  if (isProduction) {
    return '';
  }
  
  return process.env.API_URL || 'http://127.0.0.1:5000';
}

/**
 * Kiểm tra authentication
 * Ưu tiên kiểm tra cookie flag trên frontend domain (nhanh hơn)
 * Nếu có flag, có thể gọi backend để verify (tùy chọn, để tăng security)
 */
async function checkAuth(request: NextRequest): Promise<boolean> {
  // Kiểm tra cookie flag trên frontend domain (được set sau khi login thành công)
  const isAuthenticatedFlag = request.cookies.get('isAuthenticated');
  
  if (isAuthenticatedFlag?.value === 'true') {
    // Có flag, nhưng để đảm bảo security, có thể verify với backend
    // Tuy nhiên, để tránh delay, chúng ta có thể chỉ check flag trong middleware
    // và để backend verify trong các API calls thực sự
    return true;
  }

  // Nếu không có flag, có thể thử verify với backend
  // (nhưng cookies từ backend domain sẽ không có trong request này)
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // === LOGIN PAGE ===
  if (pathname === '/login') {
    // Kiểm tra xem đã authenticated chưa
    const isAuthenticated = await checkAuth(request);
    if (isAuthenticated) {
      // Đã authenticated → redirect admin
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // === ADMIN PAGE (protected) ===
  if (pathname.startsWith('/admin')) {
    // Kiểm tra authentication
    const isAuthenticated = await checkAuth(request);
    if (!isAuthenticated) {
      // Chưa authenticated → redirect login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Đã authenticated → cho vào admin
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
