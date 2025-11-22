import { notFound } from 'next/navigation';
import ReviewClient from '@/app/review/ReviewClient';
import { centersAPI } from '@/lib/api';

// Đảm bảo route này là dynamic (không phải static)
export const dynamic = 'force-dynamic';

// Trang review cho từng trung tâm, lấy thông tin theo id
export default async function ReviewPage({ params }: { params: { id: string } }) {
  try {
    // Lấy dữ liệu trung tâm theo id từ API
    const response = await centersAPI.getCenterById(params.id);

    if (!response.success || !response.data) {
      notFound();
    }

    const center = response.data;

    // Truyền dữ liệu xuống client component để render chi tiết trung tâm
    return <ReviewClient center={center} />;
  } catch (error) {
    console.error('Error fetching center:', error);
    notFound();
  }
}

