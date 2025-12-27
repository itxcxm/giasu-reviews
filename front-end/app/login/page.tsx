'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { userApi } from '@/lib/api';

export default function LoginPage() {
  // State để lưu trữ email và mật khẩu từ input của người dùng
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // State để quản lý trạng thái loading (ví dụ: vô hiệu hóa nút khi đang gửi request)
  const [loading, setLoading] = useState(false);
  // Hook của Next.js để điều hướng trang
  const router = useRouter();

  /**
   * Xử lý sự kiện đăng nhập khi người dùng gửi form.
   * @param e - Sự kiện của form
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn trình duyệt tải lại trang khi submit form
    setLoading(true); // Bắt đầu trạng thái loading

    try {
      // Gọi API để đăng nhập với email và password
      const response = await userApi.login(email, password);

      // Kiểm tra nếu đăng nhập thành công và có token trả về
      if (response && response.success && response.data?.token) {
        toast.success('Đăng nhập thành công!');
        // Lưu token vào cookie để sử dụng cho các request sau này
        Cookies.set('token', response.data.token, {
          expires: 7, // Cookie hết hạn sau 7 ngày
          secure: process.env.NODE_ENV === 'production', // Chỉ gửi cookie qua HTTPS ở môi trường production
          sameSite: 'lax', // Giảm nguy cơ tấn công CSRF
          path: '/', // Đảm bảo cookie có sẵn trên toàn bộ trang web
        });
        
        // Chuyển hướng người dùng về trang chủ.
        window.location.href = '/';
      } else {
        // Nếu API không trả về lỗi nhưng không thành công hoặc không có token
        toast.error(response?.message || 'Đăng nhập thất bại. Token không được cung cấp.');
        setLoading(false);
      }
    } catch (err: any) {
      // Xây dựng thông báo lỗi thân thiện với người dùng
      let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message; // Lỗi từ backend (ví dụ: sai mật khẩu)
      } else if (err?.message) {
        errorMessage = err.message; // Lỗi chung
      }
      
      // Xử lý các lỗi mạng cụ thể
      if (err?.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = 'Kết nối quá lâu. Vui lòng kiểm tra mạng và thử lại.';
      } else if (err.message.includes('Network Error')) {
        errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
      }

      toast.error(errorMessage);
      setLoading(false); // Dừng trạng thái loading
    }
  };

  // --- RENDER COMPONENT ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">
          {/* Phần tiêu đề */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Đăng Nhập
            </h1>
            <p className="text-slate-600">
              Chào mừng bạn trở lại!
            </p>
          </div>

          {/* Card chứa form đăng nhập */}
          <Card className="shadow-2xl border-0">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-center">
                Thông tin đăng nhập
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleLogin}
                className="space-y-4"
                autoComplete="on"
              >
                {/* Input cho Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      required
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                {/* Input cho Mật khẩu */}
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
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                    Quên mật khẩu?
                  </a>
                </div>

                {/* Nút Submit */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                  disabled={loading}
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                </Button>
              </form>

              {/* Link đến trang đăng ký */}
              <div className="mt-6 text-center text-sm text-slate-600">
                <p>
                  Bạn chưa có tài khoản?{' '}
                  <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                    Đăng ký ngay
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-slate-500 mt-8">
            © 2025 Gia Sư Reviews.
          </p>
        </div>
      </div>
    </div>
  );
}
