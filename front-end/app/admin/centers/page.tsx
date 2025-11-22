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
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Upload, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { centersAPI, Center, imageToBase64 } from '@/lib/api';

const ITEMS_PER_PAGE = 5;

interface CenterWithStatus extends Center {
  status?: 'active' | 'inactive';
}

export default function AdminCentersPage() {
  const [centers, setCenters] = useState<CenterWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [unapprovedPage, setUnapprovedPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CenterWithStatus | null>(null);
  const [deletingCenterId, setDeletingCenterId] = useState<string | null>(null);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    website: '',
    image: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [submitting, setSubmitting] = useState(false);

  // Load centers từ API
  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await centersAPI.getCenters({
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      
      // Transform centers để thêm status từ isVerified
      const transformedCenters: CenterWithStatus[] = (response.data || []).map((center: Center) => ({
        ...center,
        status: center.isVerified ? 'active' : 'inactive',
      }));
      
      setCenters(transformedCenters);
    } catch (err: any) {
      console.error('Error loading centers:', err);
      setError('Không thể tải danh sách trung tâm');
    } finally {
      setLoading(false);
    }
  };

  const filteredCenters = useMemo(() => {
    return centers.filter(
      (center) =>
        (center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (center.address && center.address.toLowerCase().includes(searchQuery.toLowerCase()))) &&
        (statusFilter === 'all' || center.status === statusFilter)
    );
  }, [centers, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredCenters.length / ITEMS_PER_PAGE);
  const paginatedCenters = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCenters.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCenters, currentPage]);

  const unapprovedCenters = useMemo(() => {
    return centers.filter((center) => center.status === 'inactive');
  }, [centers]);

  const unapprovedTotalPages = Math.ceil(unapprovedCenters.length / ITEMS_PER_PAGE);
  const paginatedUnapprovedCenters = useMemo(() => {
    const startIndex = (unapprovedPage - 1) * ITEMS_PER_PAGE;
    return unapprovedCenters.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [unapprovedCenters, unapprovedPage]);

  const handleOpenDialog = (center?: CenterWithStatus) => {
    if (center) {
      setEditingCenter(center);
      setFormData({
        name: center.name,
        address: center.address || '',
        phone: center.phone || '',
        website: center.website || '',
        image: center.image || '',
        status: center.status || 'active',
      });
      setImagePreview(center.image || null);
      setImageFile(null);
    } else {
      setEditingCenter(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
        website: '',
        image: '',
        status: 'active',
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCenter(null);
    setImagePreview(null);
    setImageFile(null);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra định dạng file
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh hợp lệ');
        return;
      }
      // Kiểm tra kích thước file (tối đa 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Kích thước ảnh không được vượt quá 10MB');
        return;
      }
      
      setImageFile(file);
      // Chỉ dùng base64 cho preview, không lưu vào formData
      try {
        const base64 = await imageToBase64(file);
        setImagePreview(base64);
      } catch (error) {
        console.error('Error converting image:', error);
        alert('Không thể xử lý hình ảnh');
      }
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    // Nếu đang edit, giữ nguyên URL hiện tại trong formData
    if (!editingCenter) {
      setFormData({ ...formData, image: '' });
    }
  };

  const handleSubmit = async () => {
    // Chỉ cần kiểm tra tên trung tâm
    if (!formData.name || !formData.name.trim()) {
      alert('Vui lòng nhập tên trung tâm');
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingCenter) {
        // Cập nhật center
        const centerData: any = {
          name: formData.name,
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
        };
        
        // Nếu có file mới, convert sang base64 và gửi lên server (server sẽ upload và lấy URL)
        if (imageFile) {
          try {
            const base64 = await imageToBase64(imageFile);
            // Gửi base64 lên server, server sẽ upload và trả về URL
            centerData.image = base64;
          } catch (error) {
            console.error('Error converting image to base64:', error);
            alert('Không thể xử lý hình ảnh');
            setSubmitting(false);
            return;
          }
        } else if (formData.image && !formData.image.startsWith('data:image/')) {
          // Giữ nguyên URL hiện tại (không phải base64)
          centerData.image = formData.image;
        }
        // Nếu không có imageFile và không có formData.image, không update image
        
        const response = await centersAPI.updateCenter(
          editingCenter._id || editingCenter.id || '',
          centerData
        );
        
        // Nếu status thay đổi, cập nhật isVerified
        if (formData.status !== editingCenter.status) {
          await centersAPI.verifyCenter(
            editingCenter._id || editingCenter.id || '',
            formData.status === 'active'
          );
        }
        
        await loadCenters();
      } else {
        // Tạo center mới - gửi tất cả dữ liệu (address, phone, website là tùy chọn)
        // Sử dụng route admin để không bị rate limit
        await centersAPI.createCenter({
          name: formData.name,
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
          imageFile: imageFile || undefined,
          isAdmin: true, // Đánh dấu là admin để sử dụng route admin
        });
        await loadCenters();
      }
      
      setCurrentPage(1);
      handleCloseDialog();
    } catch (error: any) {
      console.error('Error submitting center:', error);
      alert('Lỗi: ' + (error.message || 'Không thể lưu trung tâm'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (center: CenterWithStatus) => {
    setDeletingCenterId(center._id || center.id || null);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingCenterId) {
      try {
        await centersAPI.deleteCenter(deletingCenterId);
        await loadCenters();
        if (paginatedCenters.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (error: any) {
        console.error('Error deleting center:', error);
        alert('Không thể xóa trung tâm: ' + (error.message || 'Lỗi không xác định'));
      }
    }
    setIsDeleteDialogOpen(false);
    setDeletingCenterId(null);
  };

  const toggleStatus = async (center: CenterWithStatus) => {
    try {
      const newStatus = center.isVerified ? false : true;
      await centersAPI.verifyCenter(center._id || center.id || '', newStatus);
      await loadCenters();
    } catch (error: any) {
      console.error('Error toggling status:', error);
      alert('Không thể thay đổi trạng thái: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const activeCentersCount = centers.filter(c => c.status === 'active').length;
  const inactiveCentersCount = centers.filter(c => c.status === 'inactive').length;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý Trung tâm Gia sư
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý thông tin các trung tâm gia sư trong hệ thống
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm trung tâm mới
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng trung tâm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{centers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Đã duyệt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeCentersCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Chưa duyệt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{inactiveCentersCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Unapproved Centers */}
        <Card>
          <CardHeader>
            <CardTitle>Trung tâm chưa duyệt</CardTitle>
            <CardDescription>
              {unapprovedCenters.length > 0 
                ? `${unapprovedCenters.length} trung tâm chưa được duyệt`
                : 'Không có trung tâm nào chưa duyệt'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Đang tải...</p>
              </div>
            ) : unapprovedCenters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Không có trung tâm nào chưa duyệt</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {paginatedUnapprovedCenters.map((center) => (
                    <div key={center._id || center.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1">
                        <p className="font-medium">{center.name}</p>
                        <p className="text-sm text-muted-foreground">{center.address || 'N/A'}</p>
                        {center.createdAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(center.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        Chưa duyệt
                      </Badge>
                    </div>
                  ))}
                </div>
                {unapprovedTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Hiển thị {paginatedUnapprovedCenters.length > 0 ? (unapprovedPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(unapprovedPage * ITEMS_PER_PAGE, unapprovedCenters.length)} từ {unapprovedCenters.length} trung tâm
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUnapprovedPage(Math.max(1, unapprovedPage - 1))}
                        disabled={unapprovedPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: unapprovedTotalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={unapprovedPage === page ? 'default' : 'outline'}
                            size="sm"
                            className="w-10"
                            onClick={() => setUnapprovedPage(page)}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUnapprovedPage(Math.min(unapprovedTotalPages, unapprovedPage + 1))}
                        disabled={unapprovedPage === unapprovedTotalPages || unapprovedTotalPages === 0}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, địa chỉ..."
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
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
              setCurrentPage(1);
            }}
            className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đã duyệt</option>
            <option value="inactive">Chưa duyệt</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>Tên trung tâm</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Điện thoại</TableHead>
                <TableHead>Trạng thái</TableHead>
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
                    <Button onClick={loadCenters} className="mt-4">
                      Thử lại
                    </Button>
                  </TableCell>
                </TableRow>
              ) : paginatedCenters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      Không tìm thấy trung tâm nào
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCenters.map((center) => (
                  <TableRow key={center._id || center.id}>
                    <TableCell className="font-medium">
                      {(center._id || center.id || '').substring(0, 8)}
                    </TableCell>
                    <TableCell className="font-medium">{center.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {center.address || 'N/A'}
                    </TableCell>
                    <TableCell>{center.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          center.status === 'active' ? 'default' : 'secondary'
                        }
                        className="cursor-pointer"
                        onClick={() => toggleStatus(center)}
                      >
                        {center.status === 'active'
                          ? 'Đã duyệt'
                          : 'Chưa duyệt'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(center)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(center)}
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
            Hiển thị {paginatedCenters.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredCenters.length)} từ {filteredCenters.length} trung tâm
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCenter ? 'Chỉnh sửa trung tâm' : 'Thêm trung tâm mới'}
            </DialogTitle>
            <DialogDescription>
              {editingCenter
                ? 'Cập nhật thông tin trung tâm gia sư'
                : 'Điền thông tin để thêm trung tâm gia sư mới'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên trung tâm *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nhập tên trung tâm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Nhập địa chỉ (tùy chọn)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Điện thoại</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="0901234567 (tùy chọn)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://example.com (tùy chọn)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Hình ảnh *</Label>
              {imagePreview ? (
                <div className="relative w-full h-48 border rounded-lg overflow-hidden">
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
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
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
              )}
            </div>
            {editingCenter && (
              <div className="grid gap-2">
                <Label htmlFor="status">Trạng thái</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as 'active' | 'inactive',
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="active">Đã duyệt</option>
                  <option value="inactive">Chưa duyệt</option>
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={submitting}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                submitting ||
                !formData.name ||
                !formData.name.trim()
              }
            >
              {submitting ? 'Đang lưu...' : editingCenter ? 'Cập nhật' : 'Thêm mới'}
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
              Bạn có chắc chắn muốn xóa trung tâm này? Hành động này không thể
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
