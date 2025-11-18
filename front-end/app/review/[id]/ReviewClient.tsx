'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  Clock,
  Calendar,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

interface ReviewClientProps {
  center: any;
}

export default function ReviewClient({ center }: ReviewClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const ratingDistribution = [
    { stars: 5, count: 120, percentage: 77 },
    { stars: 4, count: 25, percentage: 16 },
    { stars: 3, count: 8, percentage: 5 },
    { stars: 2, count: 2, percentage: 1 },
    { stars: 1, count: 1, percentage: 1 },
  ];

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewText.trim().length < 10) {
      toast({
        title: 'Lỗi',
        description: 'Đánh giá phải có ít nhất 10 ký tự',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Thành công!',
      description: 'Đánh giá của bạn đã được gửi.',
    });

    setReviewText('');
    setSelectedRating(5);
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

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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
                <div className="flex flex-wrap gap-2">
                  {center.subjects.map((subject: string) => (
                    <Badge key={subject} variant="secondary" className="text-sm">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-700 leading-relaxed">{center.description}</p>
              <Separator />
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle>Đánh Giá Của Học Viên</CardTitle>
                  <CardDescription>{center.reviewCount} đánh giá </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {center.reviews.map((review: any) => (
                      <div key={review.id} className="pb-6 border-b last:border-b-0 last:pb-0">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-semibold flex items-center justify-center text-lg shrink-0">
                            {review.author.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold text-slate-900">{review.author}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex">
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

            <div className="space-y-6">
              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle>Tổng Quan Đánh Giá</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-slate-900 mb-2">{center.rating}</div>
                    <div className="flex justify-center mb-2">
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

      <footer className="border-t bg-slate-50 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-slate-600">
          <p>© 2024 Đánh Giá Gia Sư. Website đánh giá trung tâm gia sư tại Việt Nam.</p>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
