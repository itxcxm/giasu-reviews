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
 * Tối ưu cho Vercel:
 * - Đảm bảo request API cross-domain phải luôn đi kèm credentials (withCredentials).
 * - Xử lý chặt chẽ hơn việc kiểm tra đăng nhập, tránh redirect lặp/tạo request thừa trên Vercel lambda.
 * - Không rely vào client-side storage cho token, chỉ cookie.
 * - Có thể debug rõ hơn các lỗi liên quan tới cookie/set-cookie khi deploy Vercel.
 * - Nếu cần, có thể thêm debug thông tin lên UI để hỗ trợ test trên Vercel.
 */

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  // Kiểm tra login state chỉ chạy khi mount, tối ưu cho môi trường serverless
  useEffect(() => {
    let ignore = false;
    const checkAuth = async () => {
      try {
        // adminAPI.checkAuth cần bắt buộc gửi credentials!
        const response = await adminAPI.checkAuth();
        if (!ignore) {
          if (response.success && response.authenticated) {
            router.replace('/admin');
          } else {
            setCheckingAuth(false);
          }
        }
      } catch (err) {
        if (!ignore) {
          // Lỗi, nhưng vẫn hiển thị form login
          setCheckingAuth(false);
        }
      }
    };
    checkAuth();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Không đưa router vào dependency, tránh re-fetch không cần thiết do route change của next/navigation

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // adminAPI.login cũng cần credentials: "include" trong fetch!
      const response = await adminAPI.login(email, password);

      if (response.success && response.data) {
        // Đăng nhập thành công, chuyển đến trang admin
        router.replace('/admin');
      } else {
        setError(response.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        setLoading(false);
      }
    } catch (err: any) {
      // Khi Vercel gặp lỗi cookie sẽ vào đây; cần thông báo rõ ràng
      let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Đang kiểm tra đăng nhập, nên render loading (tránh flash login form gây nhầm lẫn trên Vercel)
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
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

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

              {/* Ghi nhớ đăng nhập không dùng localStorage/sessionStorage ở Vercel, vì chỉ cookie mới dùng được */}
              <div className="flex items-center justify-between text-sm">
                {/* Tùy chọn, cũng có thể bỏ đi nếu backend không có refresh token remember */}
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

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                disabled={loading}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
              </Button>
            </form>

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

        <p className="text-center text-xs text-slate-500 mt-8">
          © 2025 Gia Sư Reviews. Bảo mật và được bảo vệ.
        </p>

        {/* DEBUG cookie trên Vercel (ẩn ở prod): */}
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
