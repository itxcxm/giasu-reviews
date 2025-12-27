'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Star, MapPin, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { centersApi, Center } from '@/lib/api';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await centersApi.getCenters({
        isVerified: true,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 50,
      });
      setCenters(response.data || []);
    } catch (err) {
      console.error('Error loading centers:', err);
      setError('Không thể tải danh sách trung tâm');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    try {
      setLoading(true);
      const response = await centersApi.getCenters({
        search: query,
        isVerified: true,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 50,
      });
      setCenters(response.data || []);
    } catch (err) {
      console.error('Error searching centers:', err);
      setError('Không thể tìm kiếm trung tâm');
    } finally {
      setLoading(false);
    }
  };

  const filteredCenters = centers.filter(
    (center) =>
      !searchQuery ||
      center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (center.address && center.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto mb-12 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Tìm Trung Tâm Gia Sư
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Khám phá và đánh giá các trung tâm gia sư tốt nhất tại Việt Nam
          </p>

          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên trung tâm..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg shadow-lg border-slate-200 focus:border-blue-500"
            />
          </div>
        </div>

        {!searchQuery && (
          <div className="mb-6">
            <p className="text-slate-600 text-2xl font-bold">
              Mới Cập Nhật
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">Đang tải...</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">{error}</p>
            <Button onClick={loadCenters} className="mt-4">
              Thử lại
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCenters.map((center) => {
                const centerId = center._id || center.id;
                if (!centerId) return null;
                
                return (
                <Link key={centerId} href={`/review/${centerId}`}>
                  <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-slate-200 overflow-hidden">
                    <div className="relative w-full aspect-video overflow-hidden bg-slate-100">
                      {center.image ? (
                        <Image
                          src={center.image}
                          alt={center.name}
                          fill
                          className="object-contain transition-transform duration-300 hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                          <Users className="w-12 h-12 text-slate-400" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-yellow-700 border-yellow-200 shadow-sm">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 mr-1" />
                          {center.rating || 0}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-xl leading-tight">{center.name}</CardTitle>
                      </div>
                      {center.address && (
                        <CardDescription className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                          <span className="text-sm">{center.address}</span>
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between pt-4 border-t text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{center.totalReviews || 0} đánh giá</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                );
              })}
            </div>

            {filteredCenters.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500 text-lg mb-4">
                  {searchQuery
                    ? `Không tìm thấy trung tâm nào phù hợp với từ khóa "${searchQuery}"`
                    : 'Chưa có trung tâm nào được duyệt'}
                </p>
                {!searchQuery && (
                  <p className="text-slate-400 text-sm">
                    Các trung tâm mới thêm sẽ được hiển thị sau khi được quản trị viên duyệt.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t bg-slate-50 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-slate-600">
          <p>© 2025 Đánh Giá Trung Tâm. Website đánh giá trung tâm gia sư tại Việt Nam.</p>
        </div>
      </footer>
    </div>
  );
}
