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

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  // Kiểm tra xem đã đăng nhập chưa khi component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await adminAPI.checkAuth();
        if (response.success && response.authenticated) {
          // Đã đăng nhập, redirect về admin
          router.push('/admin');
        } else {
          // Chưa đăng nhập, cho phép hiển thị form
          setCheckingAuth(false);
        }
      } catch (err) {
        // Lỗi khi kiểm tra, vẫn cho phép hiển thị form
        console.error('Error checking auth:', err);
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await adminAPI.login(email, password);

      if (response.success && response.data) {
        // Đăng nhập thành công, chuyển đến trang admin
        router.push('/admin');
      } else {
        setError(response.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        setLoading(false);
      }
    } catch (err: any) {
      // Xử lý lỗi từ API
      const errorMessage = err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      
      // Kiểm tra nếu là lỗi tài khoản chưa active
      if (errorMessage.includes('kích hoạt') || errorMessage.includes('active')) {
        setError(errorMessage);
      } else {
        setError(errorMessage);
      }
      
      setLoading(false);
    }
  };

  // Hiển thị loading khi đang kiểm tra auth
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
            <form onSubmit={handleLogin} className="space-y-4">
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
                  />
                  <span className="text-slate-600">Ghi nhớ đăng nhập</span>
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
      </div>
    </div>
  );
}
