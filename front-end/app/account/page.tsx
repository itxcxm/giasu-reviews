'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, Mail, Calendar, Edit, Camera, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from '@/components/ui/textarea';
import { userApi, reviewsApi, Review } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

interface UserPayload {
  id: string;
  role: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    id: '',
    name: '',
    email: '',
    joinDate: '',
    avatar: '',
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const { toast } = useToast();

  // Check authentication
  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      jwtDecode<UserPayload>(token);
    } catch (error) {
      Cookies.remove('token');
      router.push('/login');
      return;
    }
  }, [router]);

  // Load user data and reviews on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  // Load user data and reviews on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError('');

      const userResponse = await userApi.getCurrentUser();
      if (userResponse.success && userResponse.data) {
        const userData = {
          id: userResponse.data.user.id,
          name: userResponse.data.user.name,
          email: userResponse.data.user.email,
          joinDate: userResponse.data.user.createdAt,
          avatar: userResponse.data.user.avatar || '',
        };
        setUser(userData);
        setEditedUser(userData);

        const reviewsResponse = await reviewsApi.getReviewsByUserId(userData.id);
        if (reviewsResponse.success) {
          setReviews(reviewsResponse.data);
        }
      } else {
        throw new Error(userResponse.message || 'Could not fetch user data');
      }

    } catch (err: any) {
      console.error('Error loading user data:', err);
      setError('Không thể tải dữ liệu người dùng');
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu người dùng",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = () => {
    // This is a mock save. In a real app, you'd call an API to update the profile.
    if (newPassword && newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }

    if (selectedAvatar) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const avatarUrl = e.target?.result as string;
        setUser({ ...editedUser, avatar: avatarUrl });
        setSelectedAvatar(null);
      };
      reader.readAsDataURL(selectedAvatar);
    } else {
      setUser(editedUser);
    }

    setNewPassword('');
    setConfirmPassword('');
    setIsEditing(false);
     toast({
        title: "Thành công",
        description: "Thông tin đã được cập nhật (mock data).",
      });
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        setEditedUser({ ...editedUser, avatar: previewUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelEdit = () => {
    setEditedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setIsEditing(false);
  };

  const handleDeleteReview = (reviewId: string) => {
    setDeletingReviewId(reviewId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteReview = async () => {
    if (!deletingReviewId) return;

    try {
      const response = await reviewsApi.deleteOwnReview(deletingReviewId);
      if (response.success) {
        setReviews(reviews.filter((r) => r._id !== deletingReviewId));
        toast({
          title: "Thành công",
          description: "Đã xóa đánh giá của bạn.",
        });
      } else {
        throw new Error(response.message || 'Không thể xóa đánh giá');
      }
    } catch (err: any) {
      console.error('Error deleting review:', err);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể xóa đánh giá, vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingReviewId(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      approved: { variant: 'default', label: 'Đã duyệt' },
      pending: { variant: 'secondary', label: 'Chờ duyệt' },
      rejected: { variant: 'destructive', label: 'Từ chối' },
    };
    const { variant, label } = variants[status] || { variant: 'secondary', label: 'Chờ duyệt' };
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Tài Khoản Của Tôi</h1>
          <p className="text-slate-600">Quản lý thông tin cá nhân và đánh giá của bạn</p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-slate-600">Đang tải...</span>
          </div>
        ) : (
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
              <TabsTrigger value="profile" className="text-base">Thông Tin Tài Khoản</TabsTrigger>
              <TabsTrigger value="reviews" className="text-base">Đánh Giá Của Tôi</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card className="shadow-lg border-slate-200">
              <CardHeader className="space-y-4 pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                          {user.name ? user.name.charAt(0) : ''}
                        </AvatarFallback>
                      </Avatar>
                      <label htmlFor="avatar-upload">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 shadow-md cursor-pointer"
                          asChild
                        >
                          <span>
                            <Camera className="w-4 h-4" />
                          </span>
                        </Button>
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">{user.name}</CardTitle>
                      <CardDescription className="text-base">
                        {user.joinDate ? `Thành viên từ ${new Date(user.joinDate).toLocaleDateString('vi-VN')}`: ''}
                      </CardDescription>
                      <div className="flex gap-4 mt-3">
                        <Badge variant="outline" className="text-sm px-3 py-1">
                          <Star className="w-3.5 h-3.5 mr-1 fill-yellow-400 text-yellow-400" />
                          {reviews.length} đánh giá
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
                      <Edit className="w-4 h-4" />
                      Chỉnh sửa
                    </Button>
                  )}
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                {isEditing ? (
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-base">Họ và tên</Label>
                        <Input
                          id="name"
                          value={editedUser.name}
                          onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-base">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editedUser.email}
                          onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-base">Mật khẩu mới</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Để trống nếu không đổi"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-base">Xác nhận mật khẩu</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Xác nhận mật khẩu mới"
                          className="h-11"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                      <Button onClick={handleCancelEdit} variant="outline">
                        Hủy
                      </Button>
                      <Button onClick={handleSaveProfile} className="gap-2">
                        Lưu thay đổi
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Email</p>
                          <p className="font-medium text-slate-900">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Ngày tham gia</p>
                          <p className="font-medium text-slate-900">
                            {user.joinDate ? new Date(user.joinDate).toLocaleDateString('vi-VN') : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Đánh Giá Của Tôi</h2>
                <p className="text-slate-600 mt-1">Bạn đã viết {reviews.length} đánh giá</p>
              </div>
            </div>

            <div className="grid gap-6">
              {reviews.map((review) => (
                <Card key={review._id} className="shadow-lg border-slate-200 overflow-hidden hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-slate-900">
                            {review.centerName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          {renderStars(review.rating)}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : ''}
                          </span>
                        </div>
                      </div>
                       <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReview(review._id!)}
                          className="text-slate-500 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                    </div>

                    <p className="text-slate-700 leading-relaxed mb-4">{review.comment}</p>

                    {review.images && review.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {review.images.map((image, index) => (
                          <div
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer border-2 border-slate-200 hover:border-blue-500 transition-colors"
                          >
                            <Image
                              src={image}
                              alt={`Review image ${index + 1}`}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {reviews.length === 0 && (
              <Card className="shadow-lg border-slate-200">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Star className="w-16 h-16 text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Chưa có đánh giá nào
                  </h3>
                  <p className="text-slate-600 text-center max-w-md">
                    Bạn chưa viết đánh giá nào. Hãy chia sẻ trải nghiệm của bạn về các trung tâm gia sư!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        )}
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                <AlertDialogDescription>
                    Hành động này không thể hoàn tác. Đánh giá của bạn sẽ bị xóa vĩnh viễn khỏi hệ thống.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteReview} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
