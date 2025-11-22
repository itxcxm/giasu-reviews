import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Navbar } from '@/components/navbar';
import { AdminGuard } from '@/components/AdminGuard';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gia sư Reviews - Admin',
  description: 'Hệ thống quản lý trung tâm gia sư và đánh giá',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <AdminGuard>
          <Navbar />
          {children}
        </AdminGuard>
      </body>
    </html>
  );
}
