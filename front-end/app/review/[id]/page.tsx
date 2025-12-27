import { notFound } from 'next/navigation';
import ReviewClient from '@/app/review/ReviewClient';
import { centersApi } from '@/lib/api';

// Đảm bảo route này là dynamic (không phải static)
export const dynamic = 'force-dynamic';

// Trang review cho từng trung tâm, lấy thông tin theo id
export default async function ReviewPage({ params }: { params: { id: string } }) {
  try {
    // Lấy dữ liệu trung tâm theo id từ API
    const response = await centersApi.getCenterById(params.id);

    if (!response.success || !response.data) {
      notFound();
    }

    const center = response.data;

    // Truyền dữ liệu xuống client component để render chi tiết trung tâm
    return <ReviewClient center={center} />;
  } catch (error: any) {
    console.error('Error fetching center:', error);
    // Log thêm thông tin để debug
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      apiUrl: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000',
    });
    notFound();
  }
}

