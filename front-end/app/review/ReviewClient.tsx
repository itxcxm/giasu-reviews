'use client';

// Các import thư viện cần thiết
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  Calendar,
  Heart,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { centersAPI, imageToBase64, Center } from '@/lib/api';

// Định nghĩa props cho component ReviewClient
interface ReviewClientProps {
  center: Center;
}

// Component chính quản lý hiển thị, gửi đánh giá và xem ảnh trung tâm
export default function ReviewClient({ center }: ReviewClientProps) {
  // Hook điều hướng Next.js (chưa sử dụng trong code này)
  const router = useRouter();

  // Hook toast để hiển thị thông báo
  const { toast } = useToast();

  // State lưu số sao đánh giá đang chọn
  const [selectedRating, setSelectedRating] = useState(5);
  // State lưu nội dung bình luận đánh giá
  const [reviewText, setReviewText] = useState('');
  // State lưu tên người đánh giá
  const [reviewerName, setReviewerName] = useState('');
  // State lưu danh sách ảnh đánh giá được tải lên: Mỗi ảnh có file và preview
  const [reviewImages, setReviewImages] = useState<{ file: File; preview: string }[]>([]);
  // State lưu chỉ số ảnh đang chọn của lightbox (modal xem hình ảnh trung tâm)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  // State lưu ảnh review đang được xem trong lightbox
  const [selectedReviewImage, setSelectedReviewImage] = useState<string | null>(null);
  // State lưu center data (có thể update sau khi thêm review)
  const [centerData, setCenterData] = useState<Center>(center);
  const [submitting, setSubmitting] = useState(false);

  // Tính toán phân bố đánh giá từ reviews thực tế
  const ratingDistribution = (() => {
    const reviews = centerData.reviews || [];
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: distribution[stars as keyof typeof distribution],
      percentage: Math.round((distribution[stars as keyof typeof distribution] / total) * 100),
    }));
  })();

  // Hàm tối ưu hóa hình ảnh (resize + đổi định dạng JPG, nén trước khi upload)
  const optimizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Không lấy được context canvas => reject
            reject(new Error('Không thể nhận canvas context'));
            return;
          }

          // Thiết lập kích thước tối đa là 1920x1920 px
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = (width * MAX_HEIGHT) / height;
              height = MAX_HEIGHT;
            }
          }

          // Set kích thước lại cho canvas và vẽ ảnh lên
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Chuyển canvas sang blob JPEG chất lượng 85%
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Nén hình ảnh thất bại'));
                return;
              }
              // Tạo file mới từ blob
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            },
            'image/jpeg',
            0.85
          );
        };
        img.onerror = () => reject(new Error('Tải hình ảnh thất bại'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Đọc file thất bại'));
      reader.readAsDataURL(file);
    });
  };

  // Xử lý khi người dùng chọn ảnh upload cho đánh giá
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Cho phép tối đa 5 ảnh
    const maxImages = 5;
    const remainingSlots = maxImages - reviewImages.length;
    
    if (remainingSlots <= 0) {
      toast({
        title: 'Lỗi',
        description: `Bạn chỉ có thể tải tối đa ${maxImages} ảnh`,
        variant: 'destructive',
      });
      return;
    }

    // Xử lý từng file được chọn
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newImages: { file: File; preview: string }[] = [];

    // Tính tổng kích thước ảnh hiện tại
    const currentTotalSize = reviewImages.reduce((sum, img) => sum + img.file.size, 0);
    const maxTotalSize = 10 * 1024 * 1024; // 10MB

    for (const file of filesToProcess) {
      // Kiểm tra định dạng file là ảnh
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Lỗi',
          description: `File "${file.name}" không phải là ảnh hợp lệ`,
          variant: 'destructive',
        });
        continue;
      }

      // Kiểm tra dung lượng file không quá 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Lỗi',
          description: `Ảnh "${file.name}" vượt quá 10MB`,
          variant: 'destructive',
        });
        continue;
      }

      // Kiểm tra tổng kích thước tất cả ảnh không quá 10MB
      const newTotalSize = currentTotalSize + file.size;
      if (newTotalSize > maxTotalSize) {
        toast({
          title: 'Lỗi',
          description: `Tổng kích thước tất cả ảnh không được vượt quá 10MB. Hiện tại: ${(currentTotalSize / (1024 * 1024)).toFixed(2)}MB, thêm ảnh này sẽ là: ${(newTotalSize / (1024 * 1024)).toFixed(2)}MB`,
          variant: 'destructive',
        });
        continue;
      }

      // Thử tối ưu image (resize+nén)
      try {
        const optimizedFile = await optimizeImage(file);
        // Tạo preview cho ảnh đã tối ưu để hiển thị
        const preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(optimizedFile);
        });
        newImages.push({ file: optimizedFile, preview });
      } catch (error) {
        toast({
          title: 'Lỗi',
          description: `Không thể tối ưu hóa ảnh "${file.name}". Vui lòng thử lại.`,
          variant: 'destructive',
        });
      }
    }

    // Thêm các ảnh mới vào danh sách
    if (newImages.length > 0) {
      setReviewImages([...reviewImages, ...newImages]);
    }

    // Reset input để có thể chọn lại cùng file
    e.target.value = '';
  };

  // Xử lý khi người dùng xóa ảnh upload khỏi đánh giá
  const handleRemoveImage = (index: number) => {
    setReviewImages(reviewImages.filter((_, i) => i !== index));
  };

  // useEffect cho phép điều khiển lightbox ảnh trung tâm bằng bàn phím (esc, mũi tên)
  useEffect(() => {
    if (selectedImageIndex === null) return;

    // Lấy danh sách ảnh trung tâm để duyệt (chỉ có 1 ảnh từ centerData.image)
    const images = centerData.image ? [centerData.image] : [];

    // Xử lý phím bấm
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImageIndex(null); // Đóng modal khi bấm escape
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        setSelectedImageIndex(
          selectedImageIndex > 0 
            ? selectedImageIndex - 1 
            : images.length - 1
        );
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        setSelectedImageIndex(
          selectedImageIndex < images.length - 1 
            ? selectedImageIndex + 1 
            : 0
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Dọn dẹp listener khi đóng modal/ component unmount
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, centerData.image]);

  // useEffect cho phép điều khiển lightbox ảnh review bằng bàn phím (esc)
  useEffect(() => {
    if (!selectedReviewImage) return;

    // Xử lý phím bấm
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedReviewImage(null); // Đóng modal khi bấm escape
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Dọn dẹp listener khi đóng modal/ component unmount
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedReviewImage]);

  // Xử lý khi user submit đánh giá mới
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra nội dung bình luận tối thiểu 10 ký tự
    if (reviewText.trim().length < 10) {
      toast({
        title: 'Lỗi',
        description: 'Đánh giá phải có ít nhất 10 ký tự',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      // Kiểm tra tổng kích thước tất cả ảnh không quá 10MB
      const totalSize = reviewImages.reduce((sum, img) => sum + img.file.size, 0);
      const maxTotalSize = 10 * 1024 * 1024; // 10MB
      
      if (totalSize > maxTotalSize) {
        toast({
          title: 'Lỗi',
          description: `Tổng kích thước tất cả ảnh không được vượt quá 10MB. Hiện tại: ${(totalSize / (1024 * 1024)).toFixed(2)}MB`,
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      // Gửi file trực tiếp thay vì base64
      const files: File[] = reviewImages.map((img) => img.file).filter((file) => file !== undefined) as File[];

      // Gửi review lên server
      const response = await centersAPI.addReview(centerData._id || centerData.id || '', {
        rating: selectedRating,
        comment: reviewText.trim(),
        reviewerName: reviewerName.trim() || undefined,
        images: files.length > 0 ? files : undefined,
      });

      if (response.success && response.data) {
        // Cập nhật center data với reviews mới
        setCenterData(response.data);

        toast({
          title: 'Thành công!',
          description: 'Đánh giá của bạn đã được gửi.',
        });

        // Reset lại nội dung cho lần đánh giá mới
        setReviewText('');
        setReviewerName('');
        setSelectedRating(5);
        setReviewImages([]);
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể gửi đánh giá. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Giao diện chính: header, thông tin trung tâm, danh sách đánh giá, form đánh giá, modal xem hình, footer
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white relative">
      {/* Nền caro đẹp cho màn hình nền */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-br from-blue-50/30 via-transparent to-cyan-50/30"></div>
      </div>
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Đánh Giá Trung Tâm
              </h1>
            </Link>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Card thông tin trung tâm */}
          <Card className="mb-8 shadow-xl border-slate-200">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-2">{centerData.name}</CardTitle>
                  <div className="flex items-center gap-4 text-slate-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold text-lg">{centerData.rating || 0}</span>
                      <span className="text-sm">({centerData.reviewCount || 0} đánh giá)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hiển thị hình ảnh trung tâm (nếu có) */}
              {centerData.image && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-cyan-600 rounded-full"></div>
                    Hình ảnh trung tâm
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div
                      className="relative aspect-video rounded-xl overflow-hidden border-2 border-slate-200 cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                      onClick={() => setSelectedImageIndex(0)}
                    >
                      <Image
                        src={centerData.image}
                        alt={centerData.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg transform group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white text-sm font-medium">Nhấn để xem lớn</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <Separator />
              {/* Thông tin liên hệ của trung tâm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {centerData.address && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <MapPin className="w-5 h-5 text-slate-400" />
                      <span>{centerData.address}</span>
                    </div>
                  )}
                  {centerData.phone && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <span>{centerData.phone}</span>
                    </div>
                  )}
                  {centerData.website && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <Globe className="w-5 h-5 text-slate-400" />
                      <a
                        href={centerData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {centerData.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vùng chia 2: danh sách đánh giá và form tổng quan đánh giá bên phải */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Danh sách đánh giá người dùng */}
              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle>Các Đánh Giá</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {centerData.reviews && centerData.reviews.length > 0 ? (
                      centerData.reviews.map((review: any, index: number) => (
                        <div key={review._id || review.id || index} className="pb-6 border-b last:border-b-0 last:pb-0">
                          <div className="flex items-start gap-4">
                            {/* Ảnh avatar (chữ cái đầu) */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-semibold flex items-center justify-center text-lg shrink-0">
                              {(review.reviewerName || review.comment || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {review.reviewerName || 'Người dùng'}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex">
                                      {/* Hiển thị số sao */}
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-4 h-4 ${
                                            i < (review.rating || 0)
                                              ? 'fill-yellow-500 text-yellow-500'
                                              : 'text-slate-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    {review.createdAt && (
                                      <span className="text-sm text-slate-500">
                                        <Calendar className="w-3 h-3 inline mr-1" />
                                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {review.comment && (
                                <p className="text-slate-700 leading-relaxed mb-3">{review.comment}</p>
                              )}
                              {(review.images && review.images.length > 0) || review.image ? (
                                <div className="flex flex-wrap gap-3 mb-3">
                                  {/* Hiển thị images array nếu có, nếu không thì dùng image (backward compatibility) */}
                                  {((review.images && review.images.length > 0) ? review.images : [review.image]).map((img: string, imgIndex: number) => (
                                    img && (
                                      <div 
                                        key={imgIndex}
                                        className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-slate-200 cursor-pointer group shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                                        onClick={() => setSelectedReviewImage(img)}
                                      >
                                        <Image
                                          src={img}
                                          alt={`Review image ${imgIndex + 1}`}
                                          fill
                                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                                          sizes="112px"
                                          unoptimized
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                            </svg>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-center py-8">Chưa có đánh giá nào</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cột bên phải: tổng quan và form gửi đánh giá mới */}
            <div className="space-y-6">
              {/* Tổng quan đánh giá: điểm trung bình, phân bố số sao */}
              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle>Tổng Quan Đánh Giá</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-slate-900 mb-2">{centerData.rating || 0}</div>
                    <div className="flex justify-center mb-2">
                      {/* Sao trung bình */}
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(centerData.rating || 0)
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-slate-600">{centerData.reviewCount || 0} đánh giá</p>
                  </div>

                  {/* Biểu đồ phân bố số sao (hiện số mẫu, phần trăm) */}
                  <div className="space-y-3">
                    {ratingDistribution.map((dist) => (
                      <div key={dist.stars} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-12">
                          <span className="text-sm font-medium">{dist.stars}</span>
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        </div>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${dist.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-600 w-12 text-right">{dist.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Form gửi đánh giá mới */}
              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle>Viết Đánh Giá</CardTitle>
                  <CardDescription>Chia sẻ trải nghiệm của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    {/* Ô nhập tên người đánh giá */}
                    <div className="space-y-2">
                      <Label htmlFor="reviewerName">Tên của bạn</Label>
                      <Input
                        id="reviewerName"
                        type="text"
                        placeholder="Nhập tên của bạn (tùy chọn)"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        className="text-base"
                      />
                    </div>

                    {/* Chọn số sao */}
                    <div className="space-y-2">
                      <Label>Đánh giá của bạn</Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setSelectedRating(rating)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-8 h-8 cursor-pointer ${
                                rating <= selectedRating
                                  ? 'fill-yellow-500 text-yellow-500'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Ô nhập nhận xét */}
                    <div className="space-y-2">
                      <Label htmlFor="review">Nhận xét</Label>
                      <Textarea
                        id="review"
                        placeholder="Chia sẻ kinh nghiệm của bạn về trung tâm này..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        rows={5}
                        className="resize-none"
                      />
                      <p className="text-xs text-slate-500">Tối thiểu 10 ký tự</p>
                    </div>

                    {/* Ảnh đánh giá (có thể up lên hoặc xóa) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="review-images">
                          Hình ảnh {reviewImages.length > 0 && `(${reviewImages.length}/5)`}
                        </Label>
                        {reviewImages.length > 0 && (
                          <span className={`text-xs ${
                            reviewImages.reduce((sum, img) => sum + img.file.size, 0) > 10 * 1024 * 1024
                              ? 'text-red-500 font-semibold'
                              : 'text-slate-500'
                          }`}>
                            {(reviewImages.reduce((sum, img) => sum + img.file.size, 0) / (1024 * 1024)).toFixed(2)}MB / 10MB
                          </span>
                        )}
                      </div>
                      {reviewImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                          {reviewImages.map((img, index) => (
                            <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-md hover:shadow-lg transition-all duration-300 group">
                              <Image
                                src={img.preview}
                                alt={`Preview ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 33vw"
                                unoptimized
                              />
                              {/* Overlay khi hover */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300"></div>
                              {/* Nút xóa ảnh */}
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-110"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                              {/* Badge số thứ tự */}
                              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                                {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {reviewImages.length < 5 && (
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 group cursor-pointer">
                          <input
                            type="file"
                            id="review-images"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="review-images"
                            className="cursor-pointer flex flex-col items-center gap-3"
                          >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Upload className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                              Thêm ảnh {reviewImages.length > 0 && `(${5 - reviewImages.length} ảnh còn lại)`}
                            </span>
                              <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF tối đa 10MB mỗi ảnh (tối đa 5 ảnh)</p>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Nút gửi đánh giá */}
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer đơn giản: bản quyền, mô tả */}
      <footer className="border-t bg-slate-50 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-slate-600">
          <p>© 2025 Đánh Giá Gia Sư. Website đánh giá trung tâm gia sư tại Việt Nam.</p>
        </div>
      </footer>

      {/* Modal xem hình ảnh trung tâm (lightbox hiển thị lớn - chuyển ảnh, thoát esc) */}
      {selectedImageIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {(() => {
              // Lấy danh sách hình ảnh dùng cho lightbox
              const images = centerData.image ? [centerData.image] : [];
              
              if (images.length === 0) return null;
              
              const currentImage = images[selectedImageIndex || 0];
              
              return (
                <>
                  {/* Nút chuyển sang ảnh trước / sau (nếu có >1 ảnh) */}
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-white/30 shadow-xl hover:scale-110 transition-all duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex(
                            selectedImageIndex > 0 
                              ? selectedImageIndex - 1 
                              : images.length - 1
                          );
                        }}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-white/30 shadow-xl hover:scale-110 transition-all duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex(
                            selectedImageIndex < images.length - 1 
                              ? selectedImageIndex + 1 
                              : 0
                          );
                        }}
                      >
                        <ChevronRight className="w-6 h-6" />
                      </Button>
                    </>
                  )}
                  
                  {/* Hình ảnh trung tâm full */}
                  <div 
                    className="relative w-full h-full flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Image
                      src={currentImage}
                      alt={`${centerData.name} - Hình ${(selectedImageIndex || 0) + 1}`}
                      fill
                      className="object-contain"
                      sizes="100vw"
                      priority
                      unoptimized
                    />
                  </div>
                  
                  {/* Nút đóng modal */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-red-500/80 backdrop-blur-md text-white border-white/30 shadow-xl hover:scale-110 transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(null);
                    }}
                  >
                    <X className="w-6 h-6" />
                  </Button>
                  
                  {/* Hiển thị số/thứ tự ảnh nếu có nhiều ảnh */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-semibold shadow-xl border border-white/30">
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  )}
                </>
              );
            })()}
            
          </div>
        </div>
      )}

      {/* Modal xem hình ảnh review (lightbox hiển thị lớn) */}
      {selectedReviewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedReviewImage(null)}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Hình ảnh review full */}
            <div 
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedReviewImage}
                alt="Review image"
                fill
                className="object-contain"
                sizes="100vw"
                priority
                unoptimized
              />
            </div>
            
            {/* Nút đóng modal */}
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-red-500/80 backdrop-blur-md text-white border-white/30 shadow-xl hover:scale-110 transition-all duration-300"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedReviewImage(null);
              }}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>
      )}

      {/* Toaster: thông báo nhẹ cho người dùng (thành công/lỗi) */}
      <Toaster />
    </div>
  );
}
