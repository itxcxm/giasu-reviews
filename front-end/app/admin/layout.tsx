import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { AdminGuard } from '@/components/AdminGuard';

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
    <AdminGuard>
      <Navbar />
      {children}
    </AdminGuard>
  );
}
