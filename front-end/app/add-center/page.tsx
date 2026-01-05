'use client';

// Các import của thư viện cần thiết
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { centersApi, userApi } from '@/lib/api';

// Component chính cho trang Thêm Trung Tâm
export default function AddCenterPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Trạng thái cho file hình ảnh và hình xem trước
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Trạng thái cho dữ liệu biểu mẫu
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    website: '',
  });

  // Trạng thái authentication
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication khi component mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setAuthLoading(true);
      const response = await userApi.checkAuth();
      setIsAuthenticated(response.authenticated);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  // Xử lý thay đổi dữ liệu đầu vào trong form
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Hàm tối ưu hóa hình ảnh (giảm kích thước & chuyển đổi định dạng)
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

          // Tính toán lại kích thước hình ảnh (tối đa 1920px, giữ tỉ lệ)
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

          // Vẽ hình ảnh lên canvas và nén
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Nén hình ảnh thất bại'));
                return;
              }
              // Tạo file hình ảnh đã tối ưu
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            },
            'image/jpeg',
            0.85 // Chất lượng: 0.85 (85%) - cân bằng giữa chất lượng và dung lượng
          );
        };
        img.onerror = () => reject(new Error('Tải hình ảnh thất bại'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Đọc file thất bại'));
      reader.readAsDataURL(file);
    });
  };

  // Xử lý sự kiện khi người dùng chọn ảnh (upload ảnh mới)
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra định dạng file
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng chọn file ảnh hợp lệ',
          variant: 'destructive',
        });
        return;
      }
      // Kiểm tra kích thước file (tối đa 10MB trước khi tối ưu)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Lỗi',
          description: 'Kích thước ảnh không được vượt quá 10MB',
          variant: 'destructive',
        });
        return;
      }

      try {
        // Tối ưu hóa ảnh (giảm dung lượng)
        const optimizedFile = await optimizeImage(file);

        setImageFile(optimizedFile);

        // Hiển thị ảnh xem trước
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(optimizedFile);
      } catch (error) {
        toast({
          title: 'Lỗi',
          description: 'Không thể tối ưu hóa ảnh. Vui lòng thử lại.',
          variant: 'destructive',
        });
      }
    }
  };

  // Xử lý khi xóa ảnh đã chọn/upload
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Function gửi request về back-end
  const submitCenterData = async () => {
    try {
      setLoading(true);

      // Gửi file trực tiếp thay vì base64
      const response = await centersApi.createCenter({
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        website: formData.website.trim() || undefined,
        imageFile: imageFile || undefined,
      });

      // Kiểm tra response thành công
      if (response.success) {
        toast({
          title: 'Thành công!',
          description: 'Trung tâm đã được thêm thành công. Trung tâm của bạn đang chờ được duyệt bởi quản trị viên trước khi hiển thị trên trang chủ.',
          duration: 5000, // Hiển thị lâu hơn để user đọc được
        });

        // Chuyển về trang chủ sau 2 giây
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        throw new Error(response.message || 'Không thể thêm trung tâm');
      }
    } catch (error: any) {
      console.error('Error creating center:', error);
      throw error; // Re-throw để handleSubmit xử lý
    } finally {
      setLoading(false);
    }
  };

  // Xử lý gửi form thêm trung tâm
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra trạng thái đăng nhập
    if (isAuthenticated === false) {
      toast({
        title: 'Yêu cầu đăng nhập',
        description: 'Người dùng chưa đăng nhập. Vui lòng đăng nhập để thêm trung tâm.',
        variant: 'destructive',
      });
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên trung tâm',
        variant: 'destructive',
      });
      return;
    }

    try {
      await submitCenterData();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể thêm trung tâm. Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  // Giao diện trang thêm trung tâm
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Phần nội dung chính */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Thêm Trung Tâm Gia Sư Mới
            </h2>
            <p className="text-slate-600">
              Điền thông tin chi tiết về trung tâm gia sư của bạn
            </p>
          </div>

          {/* Thẻ card chứa form thêm trung tâm */}
          <Card className="shadow-xl border-slate-200">
            <CardHeader>
              <CardTitle>Thông Tin Trung Tâm</CardTitle>
              <CardDescription>
                Vui lòng cung cấp thông tin chính xác và đầy đủ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Trường nhập: Tên trung tâm */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Tên trung tâm <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ví dụ: Trung Tâm Gia Sư Ánh Dương"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full text-base"
                  />
                </div>

                {/* Trường nhập: Địa chỉ */}
                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Số nhà, tên đường, quận/huyện, thành phố"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full text-base"
                  />
                </div>

                {/* Trường nhập: Số điện thoại */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="0123 456 789"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full text-base"
                  />
                </div>

                {/* Trường nhập: Website */}
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full text-base"
                  />
                </div>

                {/* Thêm trường hình ảnh trung tâm */}
                <div className="space-y-2">
                  <Label htmlFor="image">Hình ảnh trung tâm</Label>
                  {!imagePreview ? (
                    // Hiển thị nút/tải lên ảnh (nếu chưa có ảnh preview)
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="image"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                          <Upload className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                          <span className="text-blue-600 font-medium">Nhấn để tải ảnh lên</span>
                          <span className="text-slate-500"> hoặc kéo thả</span>
                        </div>
                        <p className="text-sm text-slate-500">PNG, JPG, GIF tối đa 10MB (sẽ được tối ưu tự động)</p>
                      </label>
                    </div>
                  ) : (
                    // Hiển thị ảnh preview nếu đã upload
                    <div className="relative">
                      <div className="border-2 border-slate-200 rounded-lg overflow-hidden relative w-full h-64 bg-slate-100 flex items-center justify-center">
                        {imagePreview && (
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            unoptimized
                          />
                        )}
                      </div>
                      {/* Nút xóa ảnh */}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Xóa
                      </Button>
                      {/* Hiển thị kích thước file */}
                      {imageFile && (
                        <div className="mt-2 text-xs text-slate-500">
                          Kích thước: {(imageFile.size / 1024).toFixed(0)} KB
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Nhóm nút Thêm Trung Tâm và Hủy */}
                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="flex-1" 
                    disabled={loading || authLoading || isAuthenticated === false}
                  >
                    {authLoading ? 'Đang kiểm tra...' : loading ? 'Đang xử lý...' : 'Thêm Trung Tâm'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/')}
                    disabled={loading}
                  >
                    Hủy
                  </Button>
                </div>

                {/* Thông báo nếu chưa đăng nhập */}
                {isAuthenticated === false && !authLoading && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">
                      <strong>Lưu ý:</strong> Bạn cần đăng nhập để thêm trung tâm. 
                      <Link href="/login" className="text-red-600 hover:text-red-800 underline ml-1">
                        Đăng nhập ngay
                      </Link>
                    </p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Phần footer */}
      <footer className="border-t bg-slate-50 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-slate-600">
          <p>© 2025 Đánh Giá Trung Tâm. Website đánh giá trung tâm gia sư tại Việt Nam.</p>
        </div>
      </footer>

      {/* Toaster dùng để hiển thị thông báo */}
      <Toaster />
    </div>
  );
}
