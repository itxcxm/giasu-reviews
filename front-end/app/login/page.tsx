'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { adminAPI } from '@/lib/api';

/**
 * Logic đăng nhập phù hợp với middleware:
 * - Middleware đã xử lý redirect: nếu có token ở /login → redirect /admin
 * - Nếu không có token → hiển thị form đăng nhập
 * - Không cần kiểm tra token ở client-side vì middleware đã xử lý
 * - Sau khi đăng nhập thành công, backend sẽ set cookie và redirect về /admin
 */

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginPromise = adminAPI.login(email, password);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout. Vui lòng thử lại.')), 15000);
      });

      const response = await Promise.race([loginPromise, timeoutPromise]) as any;

      if (response && response.success && response.data) {
        // Sau khi đăng nhập thành công, backend sẽ set token vào httpOnly cookie trên backend domain.
        // Để middleware có thể kiểm tra, chúng ta cũng set một cookie trên frontend domain.
        // Cookie này chỉ là flag, token thực sự vẫn ở backend domain (httpOnly, secure).
        const isProduction = window.location.protocol === 'https:';
        const secureFlag = isProduction ? '; Secure' : '';
        document.cookie = `isAuthenticated=true; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${secureFlag}`;
        
        console.log('Login successful, redirecting to admin');
        // Sử dụng window.location.href để đảm bảo cookies được gửi kèm request mới
        window.location.href = '/admin';
      } else {
        setError(response?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Login error:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
      });

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
