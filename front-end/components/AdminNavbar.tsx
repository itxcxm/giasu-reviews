/**
 * @component AdminNavbar
 * @description Thanh điều hướng dành cho trang quản trị viên.
 * Bao gồm logo, các liên kết điều hướng chính (Trung tâm, Đánh giá),
 * và chức năng đăng xuất. Có thiết kế responsive cho cả desktop và mobile.
 */
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Building2, Star, Menu, X, Users } from 'lucide-react';

export function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Trạng thái điều khiển việc đóng/mở menu trên thiết bị di động.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * @function handleLogout
   * @description Xóa cookie token của người dùng, đóng menu mobile (nếu đang mở),
   * và chuyển hướng về trang đăng nhập.
   */
  const handleLogout = () => {
    Cookies.remove('token'); // Xóa token khỏi cookie
    setIsMobileMenuOpen(false); // Đảm bảo menu mobile đóng lại
    router.push('/login'); // Chuyển hướng về trang đăng nhập
  };

  // Mảng chứa các đối tượng định nghĩa cho mỗi mục trong menu.
  const navItems = [
    {
      label: 'Trung tâm', // Tên hiển thị
      href: '/admin/centers', // Đường dẫn
      icon: Building2, // Icon từ thư viện lucide-react
    },
    {
      label: 'Đánh giá',
      href: '/admin/reviews',
      icon: Star,
    },
    {
      label: 'Người dùng',
      href: '/admin/users',
      icon: Users,
    },
  ];

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="flex items-center gap-2 font-bold text-lg"
            onClick={() => setIsMobileMenuOpen(false)} // Đóng menu khi click logo
          >
            <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Admin Panel
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              // Kiểm tra xem mục menu có đang được active hay không
              const isActive = pathname.startsWith(item.href);

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}

            <Button onClick={handleLogout} variant="outline">
              Đăng xuất
            </Button>
          </div>

          <button
            className="md:hidden p-2 rounded-md hover:bg-muted"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 space-y-2 border-t pt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)} // Đóng menu khi chọn
                >
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className="w-full justify-start gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}

            {/* Nút đăng xuất trong menu mobile */}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start"
            >
              Đăng xuất
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
