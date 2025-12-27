'use client';

// Import các thư viện và component cần thiết
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Search, ChevronLeft, ChevronRight, Star, Upload, X, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { reviewsApi, Review } from '@/lib/api';

// Định nghĩa kiểu dữ liệu review có thêm cờ trạng thái và tên học viên
interface ReviewWithStatus extends Review {
  status?: 'approved' | 'pending' | 'rejected';
  studentName?: string;
}

// Số lượng item trên mỗi trang
const ITEMS_PER_PAGE = 5;

export default function AdminReviewsPage() {
  // Các biến state phục vụ cho quản lý dữ liệu & UI
  const [reviews, setReviews] = useState<ReviewWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'rejected'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewWithStatus | null>(null);
  const [deletingReview, setDeletingReview] = useState<{ reviewId: string; } | null>(null);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  // Trạng thái cho form thêm/chỉnh sửa review (dù chức năng này bị tắt phía admin)
  const [formData, setFormData] = useState({
    centerName: '',
    studentName: '',
    rating: 5,
    comment: '',
    image: '',
    status: 'approved' as 'approved' | 'pending' | 'rejected',
  });

  // Lấy danh sách đánh giá từ API khi component mount
  useEffect(() => {
    loadReviews();
  }, []);

  // Hàm lấy danh sách đánh giá và cập nhật state
  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reviewsApi.getAllReviews({
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      
      // Chuyển đổi dữ liệu review: gắn status + tên học viên lấy từ reviewerName
      const transformedReviews: ReviewWithStatus[] = (response.data || []).map((review: Review) => ({
        ...review,
        // Giả định toàn bộ review load được từ API đã được duyệt
        status: 'approved' as const, // Có thể mở rộng về sau để hỗ trợ duyệt nếu có trường status
        studentName: review.user?.name || 'Người dùng',
      }));

      setReviews(transformedReviews);
    } catch (err: any) {
      // Xử lý lỗi khi gọi API
      console.error('Error loading reviews:', err);
      setError('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  // Danh sách review theo tìm kiếm và filter trạng thái
  const filteredReviews = useMemo(() => {
    return reviews.filter(
      (review) =>
        (review.centerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          review.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          review.comment?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (statusFilter === 'all' || review.status === statusFilter)
    );
  }, [reviews, searchQuery, statusFilter]);

  // Tính số trang dựa trên số review có sau filter
  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  // Danh sách review trên trang hiện tại
  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReviews.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReviews, currentPage]);

  // Lấy 5 đánh giá mới nhất
  const latestReviews = useMemo(() => {
    return [...reviews]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [reviews]);

  // Mở dialog xem chi tiết review (hoặc giả lập thêm mới)
  const handleOpenDialog = (review?: ReviewWithStatus) => {
    if (review) {
      setEditingReview(review);
      setFormData({
        centerName: review.centerName || '',
        studentName: review.studentName || 'Người dùng',
        rating: review.rating,
        comment: review.comment || '',
        image: review.image || '',
        status: review.status || 'approved',
      });
      // Ưu tiên lấy images (nếu có), nếu không thì chỉ lấy image đơn lẻ
      const images = (review.images && review.images.length > 0) 
        ? review.images 
        : (review.image ? [review.image] : []);
      setReviewImages(images);
      setImagePreview(review.image || (images.length > 0 ? images[0] : null));
      setImageFile(null);
    } else {
      setEditingReview(null);
      setFormData({
        centerName: '',
        studentName: '',
        rating: 5,
        comment: '',
        image: '',
        status: 'rejected',
      });
      setImagePreview(null);
      setImageFile(null);
      setReviewImages([]);
    }
    setIsDialogOpen(true);
  };

  // Đóng dialog xem/chỉnh sửa review
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingReview(null);
    setImagePreview(null);
    setImageFile(null);
    setReviewImages([]);
  };

  // Xử lý khi upload hình ảnh
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Xóa hình ảnh đã chọn
  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setFormData({ ...formData, image: '' });
  };

  // Hàm xử lý khi submit form (Giao diện thôi, thực tế admin không được tạo)
  const handleSubmit = () => {
    // Chưa hỗ trợ tạo review bởi admin (nên chỉ reset lại dialog)
    handleCloseDialog();
  };

  // Gán review chuẩn bị xóa và mở dialog xác nhận xóa
  const handleDelete = (review: ReviewWithStatus) => {
    const reviewId = review._id || review.id;
    if (reviewId) {
      setDeletingReview({reviewId});
      setIsDeleteDialogOpen(true);
    }
  };

  // Hàm xác nhận xóa và gọi API xóa review
  const confirmDelete = async () => {
    if (deletingReview) {
      try {
        await reviewsApi.deleteReview(deletingReview.reviewId);
        // Sau khi xóa, tải lại review
        await loadReviews();
        // Nếu xóa review cuối cùng của trang và không phải trang đầu, chuyển sang trang trước đó
        if (paginatedReviews.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (error: any) {
        console.error('Error deleting review:', error);
        alert('Không thể xóa đánh giá: ' + (error.message || 'Lỗi không xác định'));
      }
    }
    setIsDeleteDialogOpen(false);
    setDeletingReview(null);
  };

  // Đếm số lượng review từng trạng thái
  const approvedCount = reviews.filter(r => r.status === 'approved').length;
  const pendingCount = reviews.filter(r => r.status === 'pending').length;
  const rejectedCount = reviews.filter(r => r.status === 'rejected').length;
  // Tính điểm đánh giá trung bình
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) 
    : '0';

  // Hàm trả về style badge dựa trên trạng thái review
  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Hàm trả về nhãn trạng thái bằng tiếng Việt cho review
  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'rejected':
        return 'Từ chối';
      default:
        return '';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid gap-6">
        {/* Header */}
        {/* PHẦN ĐẦU TRANG: Tiêu đề và mô tả chức năng quản lý đánh giá */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý Đánh giá
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý và duyệt các đánh giá từ học viên
            </p>
          </div>
        </div>

        {/* Stats */}
        {/* THỐNG KÊ: Tổng số, đã duyệt, chờ duyệt, trung bình sao */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng đánh giá
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviews.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đã duyệt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Chờ duyệt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đánh giá trung bình
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{averageRating}</div>
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Latest Reviews */}
        {/* DANH SÁCH 5 ĐÁNH GIÁ MỚI NHẤT */}
        <Card>
          <CardHeader>
            <CardTitle>Đánh giá mới nhất</CardTitle>
            <CardDescription>5 đánh giá được thêm gần đây nhất</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Đang tải...</p>
              </div>
            ) : latestReviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Chưa có đánh giá nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {latestReviews.map((review) => (
                  <div key={review._id || review.id} className="p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{review.centerName || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{review.studentName || 'Người dùng'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Hiển thị số sao đánh giá */}
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="text-sm mb-2">{review.comment}</p>}
                    {getStatusLabel(review.status) && (
                      <Badge variant={getStatusBadgeVariant(review.status)}>
                        {getStatusLabel(review.status)}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search and Filter */}
        {/* THANH TÌM KIẾM VÀ LỌC TRẠNG THÁI */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo trung tâm, học viên..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          {/* Dropdown chọn trạng thái filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'rejected');
              setCurrentPage(1);
            }}
            className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>

        {/* Table */}
        {/* Bảng danh sách đánh giá đã lọc/phân trang */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>Trung tâm</TableHead>
                <TableHead>Học viên</TableHead>
                <TableHead className="text-center">Đánh giá</TableHead>
                <TableHead className="max-w-[250px]">Nhận xét</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">Đang tải...</p>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-red-500">{error}</p>
                    <Button onClick={loadReviews} className="mt-4">
                      Thử lại
                    </Button>
                  </TableCell>
                </TableRow>
              ) : paginatedReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      Không tìm thấy đánh giá nào
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReviews.map((review) => (
                  <TableRow key={review._id || review.id}>
                    <TableCell className="font-medium">
                      {(review._id || review.id || '').substring(0, 8)}
                    </TableCell>
                    <TableCell className="font-medium">{review.centerName || 'N/A'}</TableCell>
                    <TableCell>{review.studentName || 'Người dùng'}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Hiển thị số sao đánh giá */}
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate">
                      {review.comment || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Nút mở dialog xem chi tiết review */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(review)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        {/* Nút xóa review */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(review)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination and Info */}
        {/* PHÂN TRANG bảng danh sách đánh giá */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Hiển thị {paginatedReviews.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredReviews.length)} từ {filteredReviews.length} đánh giá
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              {/* Hiển thị từng nút số trang */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  className="w-10"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* View Dialog */}
      {/* Dialog xem chi tiết review (và giả lập form thêm mới) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReview ? 'Xem đánh giá' : 'Thêm đánh giá mới'}
            </DialogTitle>
            <DialogDescription>
              {editingReview
                ? 'Thông tin chi tiết đánh giá'
                : 'Điền thông tin để thêm đánh giá mới'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="centerName">Tên trung tâm *</Label>
                <Input
                  id="centerName"
                  value={formData.centerName}
                  onChange={(e) =>
                    setFormData({ ...formData, centerName: e.target.value })
                  }
                  placeholder="Nhập tên trung tâm"
                  readOnly={!!editingReview}
                  className={editingReview ? 'bg-muted cursor-default' : ''}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="studentName">Tên học viên *</Label>
                <Input
                  id="studentName"
                  value={formData.studentName}
                  onChange={(e) =>
                    setFormData({ ...formData, studentName: e.target.value })
                  }
                  placeholder="Nhập tên học viên"
                  readOnly={!!editingReview}
                  className={editingReview ? 'bg-muted cursor-default' : ''}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="rating">Đánh giá (1-5 sao) *</Label>
                <select
                  id="rating"
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData({ ...formData, rating: parseInt(e.target.value) })
                  }
                  disabled={!!editingReview}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${editingReview ? 'bg-muted cursor-default' : ''}`}
                >
                  {Array.from({ length: 5 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num} sao
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comment">Nhận xét</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) =>
                  setFormData({ ...formData, comment: e.target.value })
                }
                placeholder="Nhập nhận xét về trung tâm"
                rows={4}
                readOnly={!!editingReview}
                className={editingReview ? 'bg-muted cursor-default' : ''}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Hình ảnh {reviewImages.length > 0 && `(${reviewImages.length})`}</Label>
              {editingReview ? (
                // Khi xem chi tiết: Hiển thị các hình ảnh từ URL
                reviewImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {reviewImages.map((imgUrl, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200 shadow-md"
                      >
                        <Image
                          src={imgUrl}
                          alt={`Review image ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 33vw"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                    Không có hình ảnh
                  </div>
                )
              ) : (
                // Nếu là chế độ thêm mới (đã tắt chức năng này): Khu vực upload ảnh
                imagePreview ? (
                  <div className="relative w-full h-48 border-2 border-slate-200 rounded-xl overflow-hidden shadow-md">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 shadow-lg"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300">
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3 shadow-lg">
                        <Upload className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-blue-600">
                        Click để tải lên hình ảnh
                      </span>
                      <span className="text-xs text-slate-500 mt-1">
                        PNG, JPG, WEBP (tối đa 5MB)
                      </span>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                )
              )}
            </div>
          </form>
          <DialogFooter>
            <Button type="button" onClick={handleCloseDialog}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa review */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}