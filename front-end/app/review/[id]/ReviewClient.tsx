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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

// Định nghĩa props cho component ReviewClient
interface ReviewClientProps {
  center: any;
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
  // State lưu danh sách ảnh đánh giá được tải lên: Mỗi ảnh có file và preview
  const [reviewImages, setReviewImages] = useState<{ file: File; preview: string }[]>([]);
  // State lưu chỉ số ảnh đang chọn của lightbox (modal xem hình ảnh trung tâm)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Danh sách phân bố đánh giá (số lượng & tỷ lệ phần trăm theo mức sao), hiện cứng
  const ratingDistribution = [
    { stars: 5, count: 12, percentage: 77 },
    { stars: 4, count: 25, percentage: 16 },
    { stars: 3, count: 8, percentage: 5 },
    { stars: 2, count: 2, percentage: 1 },
    { stars: 1, count: 1, percentage: 1 },
  ];

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

    // Chỉ cho phép tối đa 1 ảnh
    const maxImages = 1;
    if (reviewImages.length >= maxImages) {
      toast({
        title: 'Lỗi',
        description: 'Bạn chỉ có thể tải tối đa 1 ảnh',
        variant: 'destructive',
      });
      return;
    }

    const file = files[0];
    if (!file) return;

    // Kiểm tra định dạng file là ảnh
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn file ảnh hợp lệ',
        variant: 'destructive',
      });
      return;
    }
    // Kiểm tra dung lượng file không quá 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Lỗi',
        description: 'Kích thước ảnh không được vượt quá 10MB',
        variant: 'destructive',
      });
      return;
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
      setReviewImages([{ file: optimizedFile, preview }]);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tối ưu hóa ảnh. Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  // Xử lý khi người dùng xóa ảnh upload khỏi đánh giá
  const handleRemoveImage = (index: number) => {
    setReviewImages(reviewImages.filter((_, i) => i !== index));
  };

  // useEffect cho phép điều khiển lightbox ảnh trung tâm bằng bàn phím (esc, mũi tên)
  useEffect(() => {
    if (selectedImageIndex === null) return;

    // Lấy danh sách ảnh trung tâm để duyệt
    const images = center.images && center.images.length > 0 
      ? center.images 
      : center.image 
        ? [center.image] 
        : [];

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
  }, [selectedImageIndex, center.images, center.image]);

  // Xử lý khi user submit đánh giá mới
  const handleSubmitReview = (e: React.FormEvent) => {
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

    // Gửi review thành công (demo), có thể gửi API tại đây
    toast({
      title: 'Thành công!',
      description: 'Đánh giá của bạn đã được gửi.',
    });

    // Reset lại nội dung cho lần đánh giá mới
    setReviewText('');
    setSelectedRating(5);
    setReviewImages([]);
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
                  <CardTitle className="text-3xl mb-2">{center.name}</CardTitle>
                  <div className="flex items-center gap-4 text-slate-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold text-lg">{center.rating}</span>
                      <span className="text-sm">({center.reviewCount} đánh giá)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hiển thị hình ảnh trung tâm (nếu có) */}
              {(center.image || (center.images && center.images.length > 0)) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Hình ảnh trung tâm</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {center.images && center.images.length > 0 ? (
                      center.images.map((img: string, index: number) => (
                        <div
                          key={index}
                          className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity group"
                          onClick={() => setSelectedImageIndex(index)}
                        >
                          <Image
                            src={img}
                            alt={`${center.name} - Hình ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                        </div>
                      ))
                    ) : center.image ? (
                      <div
                        className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity group"
                        onClick={() => setSelectedImageIndex(0)}
                      >
                        <Image
                          src={center.image}
                          alt={center.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
              <Separator />
              {/* Thông tin liên hệ của trung tâm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-700">
                    <MapPin className="w-5 h-5 text-slate-400" />
                    <span>{center.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <span>{center.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <span>{center.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Globe className="w-5 h-5 text-slate-400" />
                    <a
                      href={center.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {center.website}
                    </a>
                  </div>
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
                    {center.reviews.map((review: any) => (
                      <div key={review.id} className="pb-6 border-b last:border-b-0 last:pb-0">
                        <div className="flex items-start gap-4">
                          {/* Ảnh avatar (chữ cái đầu tên người đánh giá), tự động lấy ký tự đầu */}
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-semibold flex items-center justify-center text-lg shrink-0">
                            {review.author.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold text-slate-900">{review.author}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex">
                                    {/* Hiển thị số sao (tô màu nếu được chọn) */}
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-4 h-4 ${
                                          i < review.rating
                                            ? 'fill-yellow-500 text-yellow-500'
                                            : 'text-slate-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-slate-500">
                                    <Calendar className="w-3 h-3 inline mr-1" />
                                    {new Date(review.date).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-slate-700 leading-relaxed mb-3">{review.comment}</p>
                            {review.images && review.images.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {review.images.map((img: string, idx: number) => (
                                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200">
                                    {/* Hiển thị ảnh đánh giá */}
                                    <Image
                                      src={img}
                                      alt={`Review image ${idx + 1}`}
                                      fill
                                      className="object-cover"
                                      sizes="96px"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Nút hữu ích */}
                            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600">
                              <Heart className="w-4 h-4 mr-1" />
                              Hữu ích ({review.helpful})
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
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
                    <div className="text-5xl font-bold text-slate-900 mb-2">{center.rating}</div>
                    <div className="flex justify-center mb-2">
                      {/* Sao trung bình dựa trên center.rating (tô màu sao thỏa) */}
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(center.rating)
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-slate-600">{center.reviewCount} đánh giá</p>
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
                      <Label htmlFor="review-images">Hình ảnh</Label>
                      {reviewImages.length > 0 ? (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                          <Image
                            src={reviewImages[0].preview}
                            alt="Preview"
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            unoptimized
                          />
                          {/* Nút xóa ảnh */}
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveImage(0)}
                            className="absolute top-2 right-2"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Xóa
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                          <input
                            type="file"
                            id="review-images"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="review-images"
                            className="cursor-pointer flex flex-col items-center gap-2"
                          >
                            <Upload className="w-5 h-5 text-slate-600" />
                            <span className="text-sm text-blue-600 font-medium">
                              Thêm ảnh
                            </span>
                            <p className="text-xs text-slate-500">PNG, JPG, GIF tối đa 10MB</p>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Nút gửi đánh giá */}
                    <Button type="submit" className="w-full">
                      Gửi Đánh Giá
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
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {(() => {
              // Lấy danh sách hình ảnh dùng cho lightbox
              const images = center.images && center.images.length > 0 
                ? center.images 
                : center.image 
                  ? [center.image] 
                  : [];
              
              if (images.length === 0) return null;
              
              const currentImage = images[selectedImageIndex];
              
              return (
                <>
                  {/* Nút chuyển sang ảnh trước / sau (nếu có >1 ảnh) */}
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white border-white/20"
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
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white border-white/20"
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
                      alt={`${center.name} - Hình ${selectedImageIndex + 1}`}
                      fill
                      className="object-contain"
                      sizes="100vw"
                      priority
                    />
                  </div>
                  
                  {/* Nút đóng modal */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white border-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(null);
                    }}
                  >
                    <X className="w-6 h-6" />
                  </Button>
                  
                  {/* Hiển thị số/thứ tự ảnh nếu có nhiều ảnh */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  )}
                </>
              );
            })()}
            
          </div>
        </div>
      )}

      {/* Toaster: thông báo nhẹ cho người dùng (thành công/lỗi) */}
      <Toaster />
    </div>
  );
}
