'use client';

// Các import bên dưới: import các hook, component UI và API dùng cho quản trị trung tâm
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

// Số lượng bản ghi trên mỗi trang
const ITEMS_PER_PAGE = 10;

// Interface để lưu status theo kiểu chuỗi
interface CenterWithStatus extends Center {
  status?: 'active' | 'inactive';
}

export default function AdminCentersPage() {
  // State dùng để quản lý danh sách trung tâm, trạng thái loading, lỗi, v.v...
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

  // State cho image và form
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

  // Lấy danh sách trung tâm từ API khi load trang
  useEffect(() => {
    loadCenters();
  }, []);

  // Hàm lấy danh sách trung tâm - gọi API
  const loadCenters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await centersAPI.getAllCenters({
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      // Convert state isVerified sang status dạng chuỗi để dễ lọc
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

  // Danh sách trung tâm lọc theo tìm kiếm và trạng thái
  const filteredCenters = useMemo(() => {
    return centers.filter(
      (center) =>
        (center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (center.address && center.address.toLowerCase().includes(searchQuery.toLowerCase()))) &&
        (statusFilter === 'all' || center.status === statusFilter)
    );
  }, [centers, searchQuery, statusFilter]);

  // Tổng số trang và danh sách trung tâm của trang hiện tại
  const totalPages = Math.ceil(filteredCenters.length / ITEMS_PER_PAGE);
  const paginatedCenters = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCenters.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCenters, currentPage]);

  // Lấy danh sách trung tâm chưa duyệt (status === 'inactive')
  const unapprovedCenters = useMemo(() => {
    return centers.filter((center) => center.status === 'inactive');
  }, [centers]);

  // Tổng số trang chưa duyệt và phân trang danh sách chưa duyệt
  const unapprovedTotalPages = Math.ceil(unapprovedCenters.length / ITEMS_PER_PAGE);
  const paginatedUnapprovedCenters = useMemo(() => {
    const startIndex = (unapprovedPage - 1) * ITEMS_PER_PAGE;
    return unapprovedCenters.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [unapprovedCenters, unapprovedPage]);

  // Khi mở dialog thêm/sửa trung tâm
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

  // Đóng dialog thêm/sửa trung tâm
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCenter(null);
    setImagePreview(null);
    setImageFile(null);
  };

  // Khi chọn file ảnh mới
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
      // Lấy base64 cho preview
      try {
        const base64 = await imageToBase64(file);
        setImagePreview(base64);
      } catch (error) {
        console.error('Error converting image:', error);
        alert('Không thể xử lý hình ảnh');
      }
    }
  };

  // Xoá ảnh đã chọn
  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    // Nếu là thêm mới thì xoá luôn ở formData
    if (!editingCenter) {
      setFormData({ ...formData, image: '' });
    }
  };

  // Lưu/trả về việc thêm/sửa trung tâm - gọi API
  const handleSubmit = async () => {
    // Kiểm tra rỗng tên trung tâm
    if (!formData.name || !formData.name.trim()) {
      alert('Vui lòng nhập tên trung tâm');
      return;
    }

    try {
      setSubmitting(true);

      if (editingCenter) {
        // Dữ liệu gửi đi khi sửa
        const centerData: any = {
          name: formData.name,
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
        };

        // Nếu có file ảnh mới => upload base64 lên server
        if (imageFile) {
          try {
            const base64 = await imageToBase64(imageFile);
            centerData.image = base64;
          } catch (error) {
            console.error('Error converting image to base64:', error);
            alert('Không thể xử lý hình ảnh');
            setSubmitting(false);
            return;
          }
        } else if (formData.image && !formData.image.startsWith('data:image/')) {
          // Nếu giữ nguyên URL cũ
          centerData.image = formData.image;
        }
        // Nếu bỏ trống thì không gửi lên

        // Gửi API cập nhật
        await centersAPI.updateCenter(
          editingCenter._id || editingCenter.id || '',
          centerData
        );

        // Nếu trạng thái thay đổi thì đổi isVerified
        if (formData.status !== editingCenter.status) {
          await centersAPI.verifyCenter(
            editingCenter._id || editingCenter.id || '',
            formData.status === 'active'
          );
        }

        await loadCenters();
      } else {
        // Thêm mới trung tâm (address, phone, website là tùy chọn)
        await centersAPI.createCenter({
          name: formData.name,
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
          imageFile: imageFile || undefined,
          isAdmin: true, // Đánh dấu tạo bởi admin
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

  // Khi nhấn nút xoá 1 trung tâm
  const handleDelete = (center: CenterWithStatus) => {
    setDeletingCenterId(center._id || center.id || null);
    setIsDeleteDialogOpen(true);
  };

  // API xác nhận xoá trung tâm
  const confirmDelete = async () => {
    if (deletingCenterId) {
      try {
        await centersAPI.deleteCenter(deletingCenterId);
        await loadCenters();
        // Nếu xoá hết trang này thì chuyển về trang trước
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

  // Đổi trạng thái (duyệt / chưa duyệt) của trung tâm
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

  // Đếm số trung tâm đã duyệt/chưa duyệt
  const activeCentersCount = centers.filter(c => c.status === 'active').length;
  const inactiveCentersCount = centers.filter(c => c.status === 'inactive').length;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid gap-6">
        {/* Header Tiêu đề và nút Thêm mới */}
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

        {/* Thống kê số lượng trung tâm */}
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

        {/* Card hiển thị các trung tâm chưa duyệt */}
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
                  {/* Liệt kê các trung tâm chưa duyệt, phân trang */}
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

        {/* Thanh tìm kiếm và bộ lọc trạng thái */}
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

        {/* Bảng danh sách trung tâm (có chỉnh sửa, xoá) */}
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
                // Hiển thị dữ liệu trong bảng
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

        {/* Phân trang & thông tin số lượng bản ghi hiển thị */}
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

      {/* Dialog thêm/sửa trung tâm */}
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
              {/* Nhập tên trung tâm */}
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
              {/* Nhập địa chỉ */}
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
              {/* Nhập SĐT */}
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
              {/* Nhập website */}
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
              {/* Upload hoặc chọn lại ảnh trung tâm */}
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
            {/* Chỉ hiện trường chọn trạng thái khi sửa trung tâm */}
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

      {/* Dialog xác nhận xoá trung tâm */}
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
