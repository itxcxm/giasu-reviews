'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { adminAPI } from '@/lib/api';

/**
 * Logic đăng nhập:
 * 1. Kiểm tra xem đã có token trong cookies chưa (accessToken hoặc refreshToken)
 * 2. Nếu chưa có token → hiển thị form đăng nhập ngay
 * 3. Nếu có token → gọi API check-auth để kiểm tra token có hợp lệ không
 *    - Nếu token đúng (authenticated: true) → redirect về /admin
 *    - Nếu token sai hoặc hết hạn (authenticated: false) → hiển thị form đăng nhập
 */

/**
 * Kiểm tra xem có token trong cookies không
 */
function hasTokenInCookies(): boolean {
  if (typeof document === 'undefined') return false;
  
  // Kiểm tra accessToken hoặc refreshToken trong cookies
  const cookies = document.cookie;
  return cookies.includes('accessToken=') || cookies.includes('refreshToken=');
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let ignore = false;

    const checkAuth = async () => {
      // Bước 1: Kiểm tra xem có token trong cookies không
      const hasToken = hasTokenInCookies();

      if (!hasToken) {
        // Không có token → hiển thị form đăng nhập ngay
        if (!ignore) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[LoginPage] No token found in cookies, showing login form');
          }
          setCheckingAuth(false);
        }
        return;
      }

      // Bước 2: Có token → gọi API check-auth để kiểm tra token có hợp lệ không
      try {
        const response = await adminAPI.checkAuth();

        if (process.env.NODE_ENV === 'development') {
          console.log('[LoginPage] Check auth response:', response);
        }

        if (!ignore) {
          if (response && typeof response === 'object' && response.success && response.authenticated) {
            // Token đúng → đã đăng nhập thành công → redirect về admin
            router.replace('/admin');
            return;
          } else {
            // Token sai hoặc hết hạn → hiển thị form đăng nhập
            if (process.env.NODE_ENV === 'development') {
              console.log('[LoginPage] Token invalid or expired, showing login form');
            }
            setCheckingAuth(false);
            return;
          }
        }
      } catch (err: any) {
        if (!ignore) {
          // Lỗi khi kiểm tra token → hiển thị form đăng nhập
          console.error('[LoginPage] Check auth error:', err);
          setCheckingAuth(false);
        }
      }
    };

    // Thêm timeout để tránh chờ quá lâu (5 giây)
    const timeoutId = setTimeout(() => {
      if (!ignore) {
        console.warn('[LoginPage] Check auth timeout, showing login form');
        setCheckingAuth(false);
      }
    }, 5000);

    checkAuth();

    return () => {
      ignore = true;
      clearTimeout(timeoutId);
    };
  }, [router]);

  // Xử lý khi người dùng submit form đăng nhập
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Gọi API đăng nhập và set timeout cho request
      const loginPromise = adminAPI.login(email, password);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout. Vui lòng thử lại.')), 15000);
      });

      // Chỉ lấy response đầu tiên trả về (login thành công hoặc timeout)
      const response = await Promise.race([loginPromise, timeoutPromise]) as any;

      if (response && response.success && response.data) {
        // Đăng nhập thành công: backend sẽ tự động set token vào httpOnly cookie
        // Không cần thao tác thêm với localStorage hay lấy token

        // Chuyển hướng đến trang admin
        console.log('Login successful, redirecting to admin');
        window.location.href = '/admin';
      } else {
        // Đăng nhập thất bại, hiển thị thông báo lỗi nếu có từ backend
        setError(response?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        setLoading(false);
      }
    } catch (err: any) {
      // Ghi log lỗi chi tiết ra console
      console.error('Login error:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
      });

      // Xác định thông báo lỗi để hiển thị tiếng Việt
      let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      if (err?.message?.includes('timeout') || err?.code === 'ECONNABORTED') {
        errorMessage = 'Kết nối quá lâu. Vui lòng kiểm tra kết nối mạng và thử lại.';
      } else if (err?.message?.includes('Network Error') || !err?.response) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra cấu hình API URL.';
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  // Nếu đang kiểm tra xác thực (cookie) thì return loading UI
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Hiển thị form đăng nhập nếu chưa xác thực hoặc kiểm tra thất bại
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Quản Trị Viên
          </h1>
          <p className="text-slate-600">
            Đăng nhập vào hệ thống quản lý
          </p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">
              Đăng Nhập
            </CardTitle>
            <CardDescription className="text-center">
              Nhập thông tin tài khoản của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleLogin}
              className="space-y-4"
              autoComplete="on"
            >
              {/* Hiển thị lỗi nếu có */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Input email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              {/* Input mật khẩu */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              {/* Tuỳ chọn "Ghi nhớ đăng nhập" (đang disabled) và liên kết quên mật khẩu */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                  <span className="text-slate-400 select-none">Ghi nhớ đăng nhập</span>
                </label>
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Quên mật khẩu?
                </a>
              </div>

              {/* Nút đăng nhập */}
              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                disabled={loading}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
              </Button>
            </form>

            {/* Đoạn hiển thị nếu chưa có tài khoản */}
            <div className="mt-6 text-center text-sm text-slate-600">
              <p>
                Bạn chưa có tài khoản?{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Liên hệ quản trị
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer nhỏ bản quyền/bảo mật */}
        <p className="text-center text-xs text-slate-500 mt-8">
          © 2025 Gia Sư Reviews. Bảo mật và được bảo vệ.
        </p>

        {/* Hiển thị debug info khi không ở production */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-4 text-xs text-slate-500 text-center">
            <p>
              <b>Vercel Debug:</b>
            </p>
            <ul className="inline-block text-left">
              <li>BaseURL Backend:&nbsp;
                <code>{process.env.NEXT_PUBLIC_API_BASE_URL || '(not set)'}</code>
              </li>
              <li>
                Credentials: <code>always included</code>
              </li>
              <li>
                NODE_ENV: <code>{process.env.NODE_ENV}</code>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
