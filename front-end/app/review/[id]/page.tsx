import { notFound } from 'next/navigation';
import ReviewClient from './ReviewClient';

const mockCenters: Record<string, any> = {
  '1': {
    id: '1',
    name: 'Trung Tâm Gia Sư Ánh Dương',
    address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    phone: '028 1234 5678',
    email: 'contact@anhduong.vn',
    website: 'https://anhduong.vn',
    rating: 4.8,
    reviewCount: 156,
    subjects: ['Toán', 'Lý', 'Hóa'],
    description:
      'Trung tâm gia sư Ánh Dương là một trong những trung tâm uy tín hàng đầu tại TP.HCM. Với đội ngũ giáo viên giàu kinh nghiệm, chúng tôi cam kết mang đến chất lượng giảng dạy tốt nhất cho học sinh. Phương pháp giảng dạy hiện đại, kết hợp giữa lý thuyết và thực hành, giúp học sinh nắm vững kiến thức và phát triển toàn diện.',
    students: 500,
    yearsActive: 8,
    reviews: [
      {
        id: '1',
        author: 'Nguyễn Văn A',
        rating: 5,
        date: '2024-01-15',
        comment:
          'Trung tâm rất tốt, giáo viên tận tâm. Con tôi học toán ở đây và tiến bộ rõ rệt. Phương pháp giảng dạy dễ hiểu, con rất thích học.',
        helpful: 24,
      },
      {
        id: '2',
        author: 'Trần Thị B',
        rating: 5,
        date: '2024-01-10',
        comment:
          'Môi trường học tập chuyên nghiệp, cơ sở vật chất đầy đủ. Giáo viên nhiệt tình, luôn quan tâm đến từng học sinh. Giá cả hợp lý so với chất lượng.',
        helpful: 18,
      },
      {
        id: '3',
        author: 'Lê Văn C',
        rating: 4,
        date: '2024-01-05',
        comment:
          'Chất lượng tốt nhưng học phí hơi cao. Tuy nhiên xét về hiệu quả học tập thì vẫn đáng giá. Con tôi học hóa ở đây được 6 tháng, điểm số cải thiện nhiều.',
        helpful: 12,
      },
      {
        id: '4',
        author: 'Phạm Thị D',
        rating: 5,
        date: '2023-12-28',
        comment:
          'Rất hài lòng với trung tâm. Lớp học nhỏ nên giáo viên chăm sóc kỹ từng em. Thầy cô nhiệt tình, luôn giải đáp thắc mắc chi tiết.',
        helpful: 15,
      },
      {
        id: '5',
        author: 'Hoàng Văn E',
        rating: 5,
        date: '2023-12-20',
        comment:
          'Trung tâm uy tín, đội ngũ giáo viên giỏi. Con tôi đã đỗ vào trường chuyên nhờ học ở đây. Cảm ơn thầy cô rất nhiều!',
        helpful: 30,
      },
    ],
  },
  '2': {
    id: '2',
    name: 'Trung Tâm Gia Sư Việt Anh',
    address: '456 Lê Lợi, Quận 3, TP.HCM',
    phone: '028 2345 6789',
    email: 'info@vietanh.edu.vn',
    website: 'https://vietanh.edu.vn',
    rating: 4.6,
    reviewCount: 98,
    subjects: ['Tiếng Anh', 'Toán', 'Văn'],
    description:
      'Chuyên đào tạo tiếng Anh giao tiếp và các môn học phổ thông. Giáo viên bản ngữ kết hợp với giáo viên Việt Nam có trình độ cao. Phương pháp học tập hiện đại, tập trung vào kỹ năng thực hành.',
    students: 350,
    yearsActive: 5,
    reviews: [
      {
        id: '1',
        author: 'Mai Thị F',
        rating: 5,
        date: '2024-01-12',
        comment:
          'Trung tâm dạy tiếng Anh rất hay, con tôi tiến bộ nhanh. Giáo viên người nước ngoài rất thân thiện và nhiệt tình.',
        helpful: 20,
      },
      {
        id: '2',
        author: 'Đỗ Văn G',
        rating: 4,
        date: '2024-01-08',
        comment: 'Chương trình học bài bản, có lộ trình rõ ràng. Tuy nhiên lớp đôi khi hơi đông.',
        helpful: 8,
      },
    ],
  },
  '3': {
    id: '3',
    name: 'Trung Tâm Gia Sư Thanh Xuân',
    address: '789 Trần Hưng Đạo, Quận 5, TP.HCM',
    phone: '028 3456 7890',
    email: 'thanhxuan@gmail.com',
    website: 'https://thanhxuan.com',
    rating: 4.9,
    reviewCount: 203,
    subjects: ['Toán', 'Lý', 'Hóa', 'Sinh'],
    description:
      'Chuyên đào tạo học sinh giỏi và luyện thi đại học. Đội ngũ giáo viên là các thạc sĩ, giảng viên đại học có kinh nghiệm lâu năm. Tỷ lệ đỗ đại học cao.',
    students: 750,
    yearsActive: 12,
    reviews: [
      {
        id: '1',
        author: 'Vũ Thị H',
        rating: 5,
        date: '2024-01-14',
        comment:
          'Trung tâm tốt nhất mà tôi từng biết. Con tôi học ở đây 2 năm, từ học sinh trung bình thành học sinh giỏi. Thầy cô rất tâm huyết.',
        helpful: 45,
      },
    ],
  },
  '4': {
    id: '4',
    name: 'Trung Tâm Gia Sư Minh Khai',
    address: '321 Điện Biên Phủ, Quận 10, TP.HCM',
    phone: '028 4567 8901',
    email: 'minhkhai@edu.vn',
    website: 'https://minhkhai.edu.vn',
    rating: 4.5,
    reviewCount: 67,
    subjects: ['Tiếng Anh', 'Toán'],
    description:
      'Lớp học nhỏ với tối đa 8-10 học sinh, đảm bảo chất lượng giảng dạy. Chú trọng vào việc phát triển tư duy và kỹ năng giải quyết vấn đề.',
    students: 200,
    yearsActive: 4,
    reviews: [
      {
        id: '1',
        author: 'Bùi Văn I',
        rating: 4,
        date: '2024-01-11',
        comment: 'Lớp học nhỏ nên thầy cô chăm sóc tốt. Chất lượng ổn, giá hơi cao.',
        helpful: 10,
      },
    ],
  },
  '5': {
    id: '5',
    name: 'Trung Tâm Gia Sư Tân Phú',
    address: '654 Lạc Long Quân, Quận Tân Phú, TP.HCM',
    phone: '028 5678 9012',
    email: 'tanphu@center.vn',
    website: 'https://tanphu.center.vn',
    rating: 4.7,
    reviewCount: 134,
    subjects: ['Toán', 'Văn', 'Tiếng Anh'],
    description:
      'Trung tâm gia sư với học phí hợp lý, phù hợp với nhiều gia đình. Giáo viên tận tâm, có kinh nghiệm. Chương trình học linh hoạt theo từng học sinh.',
    students: 420,
    yearsActive: 7,
    reviews: [
      {
        id: '1',
        author: 'Cao Thị K',
        rating: 5,
        date: '2024-01-13',
        comment:
          'Học phí rẻ mà chất lượng tốt. Thầy cô nhiệt tình, luôn hỗ trợ học sinh. Rất đáng để gửi con đến đây.',
        helpful: 22,
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(mockCenters).map((id) => ({
    id: id,
  }));
}

export default function ReviewPage({ params }: { params: { id: string } }) {
  const center = mockCenters[params.id];

  if (!center) {
    notFound();
  }

  return <ReviewClient center={center} />;
}
