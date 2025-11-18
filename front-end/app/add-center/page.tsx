'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';


export default function AddCenterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
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

  const handleSubjectToggle = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSubjects.length === 0) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn ít nhất một môn học',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Thành công!',
      description: 'Trung tâm đã được thêm thành công.',
    });

    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
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

          <Card className="shadow-xl border-slate-200">
            <CardHeader>
              <CardTitle>Thông Tin Trung Tâm</CardTitle>
              <CardDescription>
                Vui lòng cung cấp thông tin chính xác và đầy đủ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Mô tả
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Mô tả chi tiết về trung tâm, điểm mạnh, phương pháp giảng dạy..."
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="text-base resize-none"
                  />
                </div>

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

      <footer className="border-t bg-slate-50 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-slate-600">
          <p>© 2024 Đánh Giá Gia Sư. Website đánh giá trung tâm gia sư tại Việt Nam.</p>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
