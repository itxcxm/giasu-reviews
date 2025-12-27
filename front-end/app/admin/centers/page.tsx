'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { centersApi, Center } from '@/lib/api';

// Mở rộng Center để có trạng thái hiển thị cho admin
interface CenterWithStatus extends Center {
  status: 'active' | 'inactive';
}

// Thông tin phân trang từ backend
interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}


function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear timeout khi value thay đổi
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

const ITEMS_PER_PAGE = 10;

export default function AdminCentersPage() {
  /* ---------------- STATE ---------------- */

  // Danh sách center hiển thị trong bảng
  const [centers, setCenters] = useState<CenterWithStatus[]>([]);

  // Danh sách center chưa duyệt (dùng cho thống kê)
  const [unapprovedCenters, setUnapprovedCenters] = useState<Center[]>([]);

  // Thông tin phân trang
  const [pagination, setPagination] = useState<PaginationState | null>(null);

  // Trạng thái loading / lỗi
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tìm kiếm + lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Giá trị search đã debounce
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Dialog xóa
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCenterId, setDeletingCenterId] = useState<string | null>(null);

  const loadCenters = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Chuyển filter UI sang isVerified cho backend
      const isVerified =
        statusFilter === 'all'
          ? undefined
          : statusFilter === 'active';

      // Gọi API lấy danh sách center có phân trang
      const response = await centersApi.getCenters({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearchQuery,
        isVerified,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      // Chuyển isVerified → status để dễ dùng trong UI
      const mapped: CenterWithStatus[] = (response.data || []).map(
        (center: Center) => ({
          ...center,
          status: center.isVerified ? 'active' : 'inactive',
        })
      );

      setCenters(mapped);
      setPagination(response.pagination || null);

      // Lấy thêm danh sách center chưa duyệt (cho thống kê)
      const unapproved = await centersApi.getCenters({
        isVerified: false,
        limit: 100,
      });
      setUnapprovedCenters(unapproved.data || []);
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách trung tâm');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, statusFilter]);

  // Load lại dữ liệu khi filter / page / search thay đổi
  useEffect(() => {
    loadCenters();
  }, [loadCenters]);


  // Mở dialog xác nhận xóa
  const handleDelete = (center: CenterWithStatus) => {
    if (!center._id) return;
    setDeletingCenterId(center._id);
    setIsDeleteDialogOpen(true);
  };

  // Xác nhận xóa center
  const confirmDelete = async () => {
    if (!deletingCenterId) return;

    try {
      await centersApi.deleteCenter(deletingCenterId);

      // Nếu xóa item cuối cùng của trang thì lùi về trang trước
      if (centers.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        await loadCenters();
      }
    } catch {
      alert('Không thể xóa trung tâm');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingCenterId(null);
    }
  };

  // Duyệt / hủy duyệt center
  const toggleStatus = async (center: CenterWithStatus) => {
    if (!center._id) return;

    try {
      const newStatus = center.status !== 'active';
      await centersApi.verifyCenter(center._id, newStatus);
      await loadCenters();
    } catch {
      alert('Không thể thay đổi trạng thái');
    }
  };

  /* =====================================================
     TÍNH TOÁN THỐNG KÊ
  ===================================================== */

  const total = pagination?.total || 0;
  const unapprovedCount = unapprovedCenters.length;
  const approvedCount = total - unapprovedCount;
  const totalPages = pagination?.totalPages || 1;

  /* =====================================================
     RENDER UI
  ===================================================== */

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Trung tâm</h1>
          <p className="text-muted-foreground">
            Quản lý thông tin các trung tâm trong hệ thống
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Thêm mới
        </Button>
      </div>

      {/* ===== THỐNG KÊ ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Tổng trung tâm</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{total}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Đã duyệt</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-green-600">
            {approvedCount}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Chưa duyệt</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-red-600">
            {unapprovedCount}
          </CardContent>
        </Card>
      </div>

      {/* ===== TÌM KIẾM + LỌC ===== */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Tìm kiếm trung tâm..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <select
          className="border rounded px-3"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as any);
            setCurrentPage(1);
          }}
        >
          <option value="all">Tất cả</option>
          <option value="active">Đã duyệt</option>
          <option value="inactive">Chưa duyệt</option>
        </select>
      </div>

      {/* ===== BẢNG DANH SÁCH ===== */}
      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên trung tâm</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : centers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              centers.map((center) => (
                <TableRow key={center._id}>
                  <TableCell>{center.name}</TableCell>
                  <TableCell>{center.address || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      className="cursor-pointer"
                      variant={center.status === 'active' ? 'default' : 'secondary'}
                      onClick={() => toggleStatus(center)}
                    >
                      {center.status === 'active' ? 'Đã duyệt' : 'Chưa duyệt'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(center)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ===== PHÂN TRANG ===== */}
      {pagination && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Trang {currentPage}/{totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ===== DIALOG XÓA ===== */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
