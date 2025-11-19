'use client';

// Các import của thư viện cần thiết
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Users, Plus, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

// Component chính cho trang Thêm Trung Tâm
export default function AddCenterPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Trạng thái cho các môn học được chọn
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Trạng thái cho file hình ảnh và hình xem trước
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Trạng thái cho dữ liệu biểu mẫu
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    students: '',
    yearsActive: '',
  });

  // Xử lý chọn/bỏ chọn môn học
  const handleSubjectToggle = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
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

  // Xử lý gửi form thêm trung tâm
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Yêu cầu chọn ít nhất một môn học (nếu có phần này)
    if (selectedSubjects.length === 0) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn ít nhất một môn học',
        variant: 'destructive',
      });
      return;
    }

    // Thông báo thành công và chuyển hướng sau 1,5s
    toast({
      title: 'Thành công!',
      description: 'Trung tâm đã được thêm thành công.',
    });

    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  // Giao diện trang thêm trung tâm
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Phần header - Thanh trên cùng */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Đánh Giá Gia Sư
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

      {/* Phần nội dung chính */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
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
                    className="text-base"
                  />
                </div>

                {/* Trường nhập: Địa chỉ */}
                <div className="space-y-2">
                  <Label htmlFor="address">
                    Địa chỉ
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Số nhà, tên đường, quận/huyện, thành phố"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="text-base"
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
                    className="text-base"
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
                    className="text-base"
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
                  <Button type="submit" size="lg" className="flex-1">
                    Thêm Trung Tâm
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/')}
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Phần footer */}
      <footer className="border-t bg-slate-50 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-slate-600">
          <p>© 2025 Đánh Giá Gia Sư. Website đánh giá trung tâm gia sư tại Việt Nam.</p>
        </div>
      </footer>

      {/* Toaster dùng để hiển thị thông báo */}
      <Toaster />
    </div>
  );
}
