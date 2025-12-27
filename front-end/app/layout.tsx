import { Navbar } from '@/components/navbar';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Đánh Giá Trung Tâm Gia Sư',
    template: '%s | Đánh Giá Trung Tâm Gia Sư',
  },
  description: 'Nền tảng đánh giá và tìm kiếm trung tâm gia sư uy tín tại Việt Nam. Xem đánh giá, điểm số và thông tin chi tiết của các trung tâm gia sư.',
  keywords: ['gia sư', 'trung tâm gia sư', 'đánh giá', 'review', 'tìm kiếm gia sư', 'học thêm'],
  authors: [{ name: 'Gia Sư Reviews' }],
  creator: 'Gia Sư Reviews',
  publisher: 'Gia Sư Reviews',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: '/',
    title: 'Đánh Giá Trung Tâm Gia Sư',
    description: 'Nền tảng đánh giá và tìm kiếm trung tâm gia sư uy tín tại Việt Nam',
    siteName: 'Đánh Giá Trung Tâm Gia Sư',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Đánh Giá Trung Tâm Gia Sư',
    description: 'Nền tảng đánh giá và tìm kiếm trung tâm gia sư uy tín tại Việt Nam',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Toaster richColors position="top-right" duration={5000} />
        </div>
      </body>
    </html>
  );
}
