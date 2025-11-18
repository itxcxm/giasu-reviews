'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Star, MapPin, Clock, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const mockCenters = [
  {
    id: '1',
    name: 'Trung Tâm Gia Sư Ánh Dương',
    address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    rating: 4.8,
    reviewCount: 156,
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop',
  },
  {
    id: '2',
    name: 'Trung Tâm Gia Sư Việt Anh',
    address: '456 Lê Lợi, Quận 3, TP.HCM',
    rating: 4.6,
    reviewCount: 98,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=250&fit=crop',
  },
  {
    id: '3',
    name: 'Trung Tâm Gia Sư Thanh Xuân',
    address: '789 Trần Hưng Đạo, Quận 5, TP.HCM',
    rating: 4.9,
    reviewCount: 203,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
  },
  {
    id: '4',
    name: 'Trung Tâm Gia Sư Minh Khai',
    address: '321 Điện Biên Phủ, Quận 10, TP.HCM',
    rating: 4.5,
    reviewCount: 67,
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=250&fit=crop',
  },
  {
    id: '5',
    name: 'Trung Tâm Gia Sư Tân Phú',
    address: '654 Lạc Long Quân, Quận Tân Phú, TP.HCM',
    rating: 4.7,
    reviewCount: 134,
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop',
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCenters, setFilteredCenters] = useState(mockCenters);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredCenters(mockCenters);
    } else {
      const filtered = mockCenters.filter(
        (center) =>
          center.name.toLowerCase().includes(query.toLowerCase()) ||
          center.address.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCenters(filtered);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Đánh Giá Gia Sư
              </h1>
            </div>
            <Link href="/add-center">
              <Button>Thêm Trung Tâm</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto mb-12 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Tìm Trung Tâm Gia Sư Uy Tín
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Khám phá và đánh giá các trung tâm gia sư tốt nhất tại Việt Nam
          </p>

          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên, địa chỉ hoặc môn học..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg shadow-lg border-slate-200 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <p className="text-slate-600">
            Tìm thấy <span className="font-semibold text-slate-900">{filteredCenters.length}</span> trung tâm
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCenters.map((center) => (
            <Link key={center.id} href={`/review/${center.id}`}>
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-slate-200 overflow-hidden">
                <div className="relative w-full h-48 overflow-hidden bg-slate-100">
                  <img
                    src={center.image}
                    alt={center.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=250&fit=crop';
                    }}
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-yellow-700 border-yellow-200 shadow-sm">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 mr-1" />
                      {center.rating}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-xl leading-tight">{center.name}</CardTitle>
                  </div>
                  <CardDescription className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                    <span className="text-sm">{center.address}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between pt-4 border-t text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{center.reviewCount} đánh giá</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredCenters.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">
              Không tìm thấy trung tâm nào phù hợp với từ khóa &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
      </main>

      <footer className="border-t bg-slate-50 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-slate-600">
          <p>© 2024 Đánh Giá Gia Sư. Website đánh giá trung tâm gia sư tại Việt Nam.</p>
        </div>
      </footer>
    </div>
  );
}
