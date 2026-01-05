'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import {
  Trash2,
  Search,
  Filter,
  Users,
  CheckCircle,
  XCircle,
  Ban,
  Loader2,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useDebounce } from '@/hooks/use-debounce';

interface Profile {
  _id: string;
  email: string;
  name: string;
  status: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  // State để lưu danh sách người dùng
  const [users, setUsers] = useState<Profile[]>([]);
  // State để quản lý trạng thái tải dữ liệu
  const [loading, setLoading] = useState(true);
  // State cho từ khóa tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  // State cho bộ lọc trạng thái
  const [statusFilter, setStatusFilter] = useState<string>('all');
  // State để mở/đóng dialog xác nhận xóa
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // State để lưu thông tin người dùng cần xóa
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  // State để quản lý trạng thái đang xóa
  const [isDeleting, setIsDeleting] = useState(false);
  // State để quản lý trạng thái đang cập nhật trạng thái người dùng
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
  // Hook để hiển thị thông báo
  const { toast } = useToast();
  // Hook debounce cho thanh tìm kiếm
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  // Hàm tải danh sách người dùng từ API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getUsers({
        search: debouncedSearchTerm,
        status: statusFilter,
      });
      if (response.success) {
        setUsers(response.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: (response as any).message || 'Không thể tải danh sách người dùng.',
        });
        setUsers([]);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh sách người dùng: ' + error.message,
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);



  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteUser(userToDelete._id);

      toast({
        title: 'Thành công',
        description: 'Đã xóa người dùng thành công',
      });

      fetchUsers();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể xóa người dùng: ' + error.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };
  // Hàm xử lý cập nhật trạng thái người dùng
  const handleUpdateStatus = async (userId: string, newStatus: 'active' | 'inactive' | 'banned') => {
    setIsUpdatingStatus(userId);
    try {
      await adminApi.updateUserStatus(userId, newStatus);

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật trạng thái người dùng',
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái: ' + error.message,
      });
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Hàm xử lý cập nhật vai trò người dùng
  const handleUpdateRole = async (userId: string, newRole: 'user' | 'admin') => {
    setIsUpdatingRole(userId);
    try {
      await adminApi.updateUser(userId, { role: newRole });

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật vai trò người dùng',
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể cập nhật vai trò: ' + error.message,
      });
    } finally {
      setIsUpdatingRole(null);
    }
  };
  // Hàm trả về Badge trạng thái tương ứng
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Hoạt động
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="secondary">
            <XCircle className="mr-1 h-3 w-3" />
            Không hoạt động
          </Badge>
        );
      case 'banned':
        return (
          <Badge variant="destructive">
            <Ban className="mr-1 h-3 w-3" />
            Bị chặn
          </Badge>
        );
      default:
        return null;
    }
  };
  // Tính toán số liệu thống kê người dùng
  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    inactive: users.filter((u) => u.status === 'inactive').length,
    banned: users.filter((u) => u.status === 'banned').length,
  };

  // Render giao diện quản lý người dùng
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Quản lý người dùng</h1>
        <p className="text-muted-foreground">
          Xem, chỉnh sửa và quản lý quyền người dùng trong hệ thống
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoạt động</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Không hoạt động</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bị chặn</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.banned}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Lọc trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                  <SelectItem value="banned">Bị chặn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Hiển thị Skeleton khi đang tải dữ liệu */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            // Bảng hiển thị danh sách người dùng
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Hiển thị thông báo nếu không có người dùng */}
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Không tìm thấy người dùng nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Render từng hàng người dùng
                    users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">
                          {user.name || 'Chưa cập nhật'}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          {user.role === 'admin' ? (
                            <Badge variant="destructive" className="text-xs">
                              Quản trị viên
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Người dùng
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell className="text-right">
                          {/* Các nút thao tác: cập nhật trạng thái và xóa */}
                          <div className="flex justify-end gap-2">
                            <Select
                              value={user.role}
                              onValueChange={(value) => handleUpdateRole(user._id, value as 'user' | 'admin')}
                              disabled={isUpdatingStatus === user._id || isUpdatingRole === user._id}
                            >
                              <SelectTrigger className="w-[140px]">
                                {isUpdatingRole === user._id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <SelectValue placeholder="Vai trò" />
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Người dùng</SelectItem>
                                <SelectItem value="admin">Quản trị viên</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={user.status}
                              onValueChange={(value) => handleUpdateStatus(user._id, value as 'active' | 'inactive' | 'banned')}
                              disabled={isUpdatingStatus === user._id || isUpdatingRole === user._id}
                            >
                              <SelectTrigger className="w-[140px]">
                                {isUpdatingStatus === user._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SelectValue />}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Hoạt động</SelectItem>
                                <SelectItem value="inactive">Không hoạt động</SelectItem>
                                <SelectItem value="banned">Chặn</SelectItem>
                              </SelectContent>
                            </Select>

                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                setUserToDelete(user);
                                setDeleteDialogOpen(true);
                              }}
                              disabled={isDeleting}
                            >
                              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* AlertDialog xác nhận xóa người dùng */}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa người dùng <strong>{userToDelete?.email}</strong>?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Component Toaster để hiển thị thông báo */}
      <Toaster />
    </div>
  );
}
