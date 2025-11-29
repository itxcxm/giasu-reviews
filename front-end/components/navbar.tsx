'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Building2, Star } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const logOut = async () => {
    try {
      await adminAPI.logout();
      // Sau khi logout, chuyển về trang đăng nhập hoặc reload
      router.push('/login');
    } catch (error) {
      // Có thể hiển thị toast lỗi nếu muốn
      window.location.reload();
    }
  }

  const navItems = [
    {
      label: 'Trung tâm',
      href: '/admin/centers',
      icon: Building2,
    },
    {
      label: 'Đánh giá',
      href: '/admin/reviews',
      icon: Star,
    },
  ];

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Building2 className="h-6 w-6" />
            <span>Gia sư Reviews</span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
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
            <div>
              <Button onClick={logOut} className="gap-2"> Đăng Xuất</Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
