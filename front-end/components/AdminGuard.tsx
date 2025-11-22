'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '@/lib/api';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await adminAPI.checkAuth();
        
        // Chỉ kiểm tra xem token có đúng không
        if (response.success && response.authenticated) {
          setIsAuthenticated(true);
          setError(null);
        } else {
          // Token không hợp lệ hoặc chưa đăng nhập
          setIsAuthenticated(false);
          setError(null);
        }
      } catch (error: any) {
        console.error('Auth check error:', error);
        
        // Xử lý các loại lỗi khác nhau
        const errorMessage = error?.message || 'Không thể kiểm tra đăng nhập';
        
        // Nếu là lỗi kết nối hoặc API URL không được set
        if (
          errorMessage.includes('không thể kết nối') ||
          errorMessage.includes('NEXT_PUBLIC_API_URL') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('ENOTFOUND')
        ) {
          setError('Không thể kết nối đến server. Vui lòng kiểm tra cấu hình API URL.');
          // Không redirect ngay, để user thấy thông báo lỗi
          setIsAuthenticated(false);
        } else {
          // Lỗi khác
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Show loading state while checking authentication
  if (isLoading || isAuthenticated === null) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Show error message if there's a connection error
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Lỗi kết nối</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children
  if (!isAuthenticated) {
    return null;
  }

  // If authenticated, render children
  return <>{children}</>;
}

