'use client';

// Các import thư viện cần thiết
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
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
import { toast } from 'sonner';
import { centersApi, imageToBase64, Center, Review, reviewsApi } from '@/lib/api';

// Định nghĩa props cho component ReviewClient
interface ReviewClientProps {
  center: Center;
}

interface UserPayload {
  id: string;
  role: string;
}

// Component chính quản lý hiển thị, gửi đánh giá và xem ảnh trung tâm
export default function ReviewClient({ center }: ReviewClientProps) {
  const router = useRouter();

  // Khai báo các state quản lý trạng thái của component
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewImages, setReviewImages] = useState<{ file: File; preview: string }[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedReviewImage, setSelectedReviewImage] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<UserPayload | null>(null);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decoded = jwtDecode<UserPayload>(token);
        setUser(decoded);
      } catch (error) {
        console.error('Invalid token:', error);
        Cookies.remove('token');
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  // useEffect để tải danh sách đánh giá khi component mount hoặc center._id thay đổi
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await reviewsApi.getReviewsByCenterId(center._id);
        if (response.success) {
          setReviews(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch reviews", error);
        toast.error("Không thể tải danh sách đánh giá.");
      }
    };

    if (center._id) {
      fetchReviews();
    }
  }, [center._id]);

  // Tính toán phân bố đánh giá từ reviews thực tế
  const ratingDistribution = (() => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating as keyof typeof distribution]++;
      }
    });

    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: distribution[stars as keyof typeof distribution],
      percentage: Math.round((distribution[stars as keyof typeof distribution] / total) * 100),
    }));
  })();

  // Hàm tối ưu hóa hình ảnh: nén và resize để giảm kích thước file
  const optimizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Không thể nhận canvas context'));
            return;
          }

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

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Nén hình ảnh thất bại'));
                return;
              }
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

  // Hàm xử lý sự kiện chọn file ảnh từ input
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxImages = 5;
    const remainingSlots = maxImages - reviewImages.length;
    
    if (remainingSlots <= 0) {
      toast.error(`Bạn chỉ có thể tải tối đa ${maxImages} ảnh`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newImages: { file: File; preview: string }[] = [];

    const currentTotalSize = reviewImages.reduce((sum, img) => sum + img.file.size, 0);
    const maxTotalSize = 10 * 1024 * 1024; // 10MB

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) {
        toast.error(`File "${file.name}" không phải là ảnh hợp lệ`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Ảnh "${file.name}" vượt quá 10MB`);
        continue;
      }

      const newTotalSize = currentTotalSize + file.size;
      if (newTotalSize > maxTotalSize) {
        toast.error(`Tổng kích thước tất cả ảnh không được vượt quá 10MB.`);
        continue;
      }

      try {
        const optimizedFile = await optimizeImage(file);
        const preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(optimizedFile);
        });
        newImages.push({ file: optimizedFile, preview });
      } catch (error) {
        toast.error(`Không thể tối ưu hóa ảnh "${file.name}". Vui lòng thử lại.`);
      }
    }

    if (newImages.length > 0) {
      setReviewImages([...reviewImages, ...newImages]);
    }

    e.target.value = '';
  };

  // Hàm xóa ảnh khỏi danh sách reviewImages
  const handleRemoveImage = (index: number) => {
    setReviewImages(reviewImages.filter((_, i) => i !== index));
  };

  // useEffect để xử lý sự kiện bàn phím cho lightbox hình ảnh trung tâm
  useEffect(() => {
    if (selectedImageIndex === null) return;

    const images = center.image ? [center.image] : [];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImageIndex(null);
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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, center.image]);

  // useEffect để xử lý sự kiện bàn phím cho lightbox hình ảnh đánh giá
  useEffect(() => {
    if (!selectedReviewImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedReviewImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedReviewImage]);

  // Hàm xử lý gửi đánh giá mới
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Bạn phải đăng nhập để gửi đánh giá');
      router.push('/login');
      return;
    }
    
    if (reviewText.trim().length < 10) {
      toast.error('Đánh giá phải có ít nhất 10 ký tự');
      return;
    }

    setSubmitting(true);
    try {
      const totalSize = reviewImages.reduce((sum, img) => sum + img.file.size, 0);
      const maxTotalSize = 10 * 1024 * 1024; // 10MB
      
      if (totalSize > maxTotalSize) {
        toast.error(`Tổng kích thước tất cả ảnh không được vượt quá 10MB.`);
        setSubmitting(false);
        return;
      }

      const files: File[] = reviewImages.map((img) => img.file).filter((file) => file !== undefined) as File[];

      const response = await centersApi.addReview(center._id || center.id || '', {
        rating: selectedRating,
        comment: reviewText.trim(),
        images: files.length > 0 ? files : undefined,
      });

      if (response.success && response.data) {
        setReviews(prev => [response.data, ...prev]);
        toast.success('Đánh giá của bạn đã được gửi thành công!');
        setReviewText('');
        setSelectedRating(5);
        setReviewImages([]);
      } else {
        toast.error(response.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render giao diện component
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white relative">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-br from-blue-50/30 via-transparent to-cyan-50/30"></div>
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Trở lại
            </Button>
          </div>
          {/* Card thông tin trung tâm */}
          <Card className="mb-8 shadow-xl border-slate-200">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-2">{center.name}</CardTitle>
                  <div className="flex items-center gap-4 text-slate-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold text-lg">{center.rating || 0}</span>
                      <span className="text-sm">({reviews.length || 0} đánh giá)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hiển thị hình ảnh trung tâm (nếu có) */}
              {center.image && (
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
                        src={center.image}
                        alt={center.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        unoptimized
                      />
                    </div>
                  </div>
                </div>
              )}
              <Separator />
              {/* Thông tin liên hệ của trung tâm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {center.address && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <MapPin className="w-5 h-5 text-slate-400" />
                      <span>{center.address}</span>
                    </div>
                  )}
                  {center.phone && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <span>{center.phone}</span>
                    </div>
                  )}
                  {center.website && (
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
                    {reviews && reviews.length > 0 ? (
                      reviews.map((review: any, index: number) => (
                        <div key={review._id || review.id || index} className="pb-6 border-b last:border-b-0 last:pb-0">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-semibold flex items-center justify-center text-lg shrink-0">
                              {(review.user?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {review.user?.name || 'Người dùng'}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex">
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
              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle>Tổng Quan Đánh Giá</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-slate-900 mb-2">{center.rating || 0}</div>
                    <div className="flex justify-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(center.rating || 0)
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-slate-600">{reviews.length || 0} đánh giá</p>
                  </div>
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

              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle>Viết Đánh Giá</CardTitle>
                  <CardDescription>Chia sẻ trải nghiệm của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
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
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-110"
                              >
                                <X className="w-4 h-4" />
                              </Button>
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

      <footer className="border-t bg-slate-50 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-slate-600">
          <p>© 2025 Đánh Giá Gia Sư. Website đánh giá trung tâm gia sư tại Việt Nam.</p>
        </div>
      </footer>

      {selectedImageIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedImageIndex(null)}
        >
          {/* Nội dung lightbox cho hình ảnh trung tâm */}
        </div>
      )}

      {selectedReviewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedReviewImage(null)}
        >
          {/* Nội dung lightbox cho hình ảnh đánh giá */}
        </div>
      )}
    </div>
  );
}