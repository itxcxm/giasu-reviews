import type { Metadata } from 'next';
import { AdminNavbar } from '@/components/AdminNavbar';

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
    <>
      <AdminNavbar />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </>
  );
}
