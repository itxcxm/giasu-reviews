'use client';

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
import { Plus, Trash2, Search, ChevronLeft, ChevronRight, Star, Upload, X, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { centersAPI, Review } from '@/lib/api';

interface ReviewWithStatus extends Review {
  status?: 'approved' | 'pending' | 'rejected';
  studentName?: string;
}

const ITEMS_PER_PAGE = 5;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'rejected'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewWithStatus | null>(null);
  const [deletingReview, setDeletingReview] = useState<{ centerId: string; reviewId: string } | null>(null);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    centerName: '',
    studentName: '',
    rating: 5,
    comment: '',
    image: '',
    status: 'approved' as 'approved' | 'pending' | 'rejected',
  });


  // Load reviews từ API
  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await centersAPI.getAllReviews({
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      
      // Transform reviews để thêm status và studentName
      const transformedReviews: ReviewWithStatus[] = (response.data || []).map((review: Review) => ({
        ...review,
        status: 'approved' as const, // Tất cả reviews đã được duyệt (vì đã được thêm vào center)
        studentName: review.reviewerName || 'Người dùng', // Sử dụng reviewerName từ API
      }));
      
      setReviews(transformedReviews);
    } catch (err: any) {
      console.error('Error loading reviews:', err);
      setError('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter(
      (review) =>
        (review.centerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          review.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          review.comment?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (statusFilter === 'all' || review.status === statusFilter)
    );
  }, [reviews, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReviews.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReviews, currentPage]);

  const latestReviews = useMemo(() => {
    return [...reviews]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [reviews]);

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
      setImagePreview(review.image || null);
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
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingReview(null);
    setImagePreview(null);
    setImageFile(null);
  };

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

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setFormData({ ...formData, image: '' });
  };

  const handleSubmit = () => {
    // Note: Hiện tại không có API để tạo review trực tiếp từ admin
    // Reviews chỉ được tạo từ users qua center
    handleCloseDialog();
  };

  const handleDelete = (review: ReviewWithStatus) => {
    if (review.centerId && (review._id || review.id)) {
      setDeletingReview({
        centerId: review.centerId,
        reviewId: review._id || review.id || '',
      });
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (deletingReview) {
      try {
        await centersAPI.deleteReview(deletingReview.centerId, deletingReview.reviewId);
        await loadReviews(); // Reload danh sách
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

  const approvedCount = reviews.filter(r => r.status === 'approved').length;
  const pendingCount = reviews.filter(r => r.status === 'pending').length;
  const rejectedCount = reviews.filter(r => r.status === 'rejected').length;
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) 
    : '0';

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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(review)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
              <Label htmlFor="image">Hình ảnh</Label>
              {imagePreview ? (
                <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {!editingReview && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                !editingReview && (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 rounded-lg p-4 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Click để tải lên hình ảnh
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
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
              {editingReview && !imagePreview && (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Không có hình ảnh
                </div>
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

      {/* Delete Confirmation Dialog */}
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
