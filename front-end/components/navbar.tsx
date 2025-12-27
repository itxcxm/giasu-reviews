'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { Button } from '@/components/ui/button';
import {
  Building2,
  User as UserIcon,
  Menu,
  X,
} from 'lucide-react';

/* ============================
   KIỂU DỮ LIỆU TOKEN
============================ */

interface UserPayload {
  id: string;
  role: string;
}

/* ============================
   COMPONENT NAVBAR
============================ */

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Thông tin user lấy từ token
  const [user, setUser] = useState<UserPayload | null>(null);

  // Trạng thái mở / đóng menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* ============================
     ĐỌC TOKEN TỪ COOKIE
  ============================ */

  useEffect(() => {
    const token = Cookies.get('token');

    if (token) {
      try {
        const decoded = jwtDecode<UserPayload>(token);
        setUser(decoded);
      } catch (error) {
        // Token lỗi → xóa
        console.error('Invalid token on navbar:', error);
        Cookies.remove('token');
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [pathname]); // chạy lại khi đổi trang

  /* ============================
     ĐĂNG XUẤT
  ============================ */

  const handleLogout = () => {
    Cookies.remove('token');
    setUser(null);
    setIsMobileMenuOpen(false);
    router.push('/login');
  };

  const isAdmin = user?.role === 'admin';

  /* ============================
     ẨN NAVBAR Ở TRANG ADMIN
  ============================ */

  if (pathname.startsWith('/admin')) {
    return null;
  }

  /* ============================
     RENDER
  ============================ */

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* ===== LOGO ===== */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Đánh Giá Trung Tâm
            </span>
          </Link>

          {/* ===== MENU PC ===== */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="ghost">Trang Admin</Button>
                  </Link>
                )}

                <Link href="/account">
                  <Button variant="ghost" className="gap-2">
                    <UserIcon className="h-4 w-4" />
                    Tài khoản
                  </Button>
                </Link>

                <Button onClick={handleLogout} variant="outline">
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant={pathname === '/login' ? 'default' : 'ghost'}>
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    variant={pathname === '/register' ? 'default' : 'outline'}
                  >
                    Đăng ký
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* ===== NÚT MENU MOBILE ===== */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-muted"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* ===== MENU MOBILE ===== */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 space-y-2 border-t pt-4">
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Trang Admin
                    </Button>
                  </Link>
                )}

                <Link
                  href="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    <UserIcon className="h-4 w-4" />
                    Tài khoản
                  </Button>
                </Link>

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full justify-start"
                >
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    Đăng nhập
                  </Button>
                </Link>

                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                  >
                    Đăng ký
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
