
// API utility functions
import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * Lấy API URL từ environment variable
 * Tối ưu cho Vercel production
 */
const getApiBaseUrl = (): string => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isServer = typeof window === 'undefined';
  
  // Ưu tiên NEXT_PUBLIC_API_URL (available cả client và server)
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  
  if (publicApiUrl) {
    // Đảm bảo URL có protocol
    if (publicApiUrl.startsWith('http://') || publicApiUrl.startsWith('https://')) {
      return publicApiUrl;
    }
    // Tự động thêm https:// cho production
    if (isProduction) {
      return `https://${publicApiUrl}`;
    }
    return `http://${publicApiUrl}`;
  }
  
  // Production: BẮT BUỘC phải có NEXT_PUBLIC_API_URL
  if (isProduction) {
    const errorMsg = 'NEXT_PUBLIC_API_URL is required in production. Please set it in Vercel Environment Variables.';
    if (isServer) {
      console.error(`[Server] ${errorMsg}`);
    } else {
      console.error(`[Client] ${errorMsg}`);
    }
    // Trả về empty string để tránh gọi API sai
    return '';
  }
  
  // Development fallback
  if (isServer) {
    return process.env.API_URL || 'http://127.0.0.1:5000';
  }
  
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

// Validate API URL trong production
if (process.env.NODE_ENV === 'production' && !API_BASE_URL) {
  console.error('⚠️ API_BASE_URL is empty in production! All API calls will fail.');
  console.error('Please set NEXT_PUBLIC_API_URL in Vercel Dashboard > Settings > Environment Variables');
}

// Tạo axios instance với cấu hình tối ưu cho Vercel
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Quan trọng cho cookies authentication
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 giây timeout cho production (Vercel có thể chậm hơn)
  // Tối ưu cho production
  maxRedirects: 5,
  validateStatus: (status) => status < 500, // Không throw error cho 4xx
});

// Response interceptor để xử lý lỗi tốt hơn trong production
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Log lỗi trong development, ẩn trong production
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        message: error.message,
        url: error.config?.url,
        status: error.response?.status,
        baseURL: error.config?.baseURL,
      });
    }
    
    // Xử lý lỗi kết nối
    if (!error.response) {
      const isProduction = process.env.NODE_ENV === 'production';
      const baseURL = error.config?.baseURL || API_BASE_URL;
      
      if (isProduction && !baseURL) {
        return Promise.reject(new Error('API URL chưa được cấu hình. Vui lòng kiểm tra environment variables trên Vercel.'));
      }
      
      return Promise.reject(new Error('Không thể kết nối đến server. Vui lòng thử lại sau.'));
    }
    
    return Promise.reject(error);
  }
);

// Types
export interface Center {
  _id: string;
  id?: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  image?: string;
  rating: number;
  totalReviews: number;
  averageRating: number;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  _id?: string;
  id?: string;
  rating: number;
  comment?: string;
  image?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  centerId?: string;
  centerName?: string;
  user: {
    _id: string;
    name: string;
  }
}

export interface CreateCenterData {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  image?: string;
}

export interface CreateReviewData {
  rating: number;
  comment?: string;
  image?: string;
  images?: string[] | File[];
}

// API Functions
export const centersApi = {
  
  // Lấy danh sách centers
  async getCenters(params?: {
    search?: string;
    isVerified?: boolean | string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: Center[]; pagination?: any }> {
    const response = await apiClient.get('/api/centers', {
      params: {
        search: params?.search,
        isVerified: params?.isVerified !== undefined ? String(params.isVerified) : undefined,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
        page: params?.page,
        limit: params?.limit,
      },
    });
    return response.data;
  },

  // Lấy center theo ID
  async getCenterById(id: string): Promise<{ success: boolean; data: Center }> {
    const response = await apiClient.get(`/api/centers/${id}`);
    return response.data;
  },

  // Tạo center mới
  async createCenter(data: CreateCenterData & { imageFile?: File; }): Promise<{ success: boolean; data: Center; message?: string }> {
    const endpoint = '/api/centers';
    
    if (data.imageFile) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('address', data.address || '');
      formData.append('phone', data.phone || '');
      formData.append('website', data.website || '');
      formData.append('image', data.imageFile);

      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      const response = await apiClient.post(endpoint, data);
      return response.data;
    }
  },

  // Thêm review cho center
  async addReview(centerId: string, data: CreateReviewData & { images?: File[] }): Promise<{ success: boolean; data: Review; message?: string }> {
    if (data.images && data.images.length > 0) {
      const formData = new FormData();
      formData.append('comment', data.comment || '');
      
      data.images.forEach((file) => {
        formData.append('images', file);
      });

      const response = await apiClient.post(`/api/centers/${centerId}/reviews`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      const response = await apiClient.post(`/api/centers/${centerId}/reviews`, data);
      return response.data;
    }
  },

  // Cập nhật center (admin)
  async updateCenter(id: string, data: Partial<CreateCenterData>): Promise<{ success: boolean; data: Center; message?: string }> {
    const response = await apiClient.put(`/api/centers/${id}`, data);
    return response.data;
  },

  // Xóa center (admin)
  async deleteCenter(id: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.delete(`/api/centers/${id}`);
    return response.data;
  },

  // Duyệt/hủy duyệt center (admin)
  async verifyCenter(id: string, isVerified: boolean): Promise<{ success: boolean; data: Center; message?: string }> {
    const response = await apiClient.put(`/api/centers/${id}/verify`, { isVerified });
    return response.data;
  },
};

// Admin API Functions
export const adminApi = {
  // Đăng xuất admin
  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/api/admin/logout');
    return response.data;
  },
  // Đăng nhập admin
  async login(email: string, password: string): Promise<{ success: boolean; message: string; data?: { admin: any } }> {
    const response = await apiClient.post('/api/admin/login', { email, password });
    return response.data;
  },

  // Lấy thông tin admin hiện tại
  async getCurrentAdmin(): Promise<{ success: boolean; message: string; data?: { admin: any } }> {
    const response = await apiClient.get('/api/admin/me');
    return response.data;
  },

  // Lấy danh sách người dùng
  async getUsers(params?: { search?: string; status?: string }): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get('/api/admin/users', { params });
    return response.data;
  },

  // Xóa người dùng
  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/api/admin/users/${userId}`);
  },

  // Cập nhật trạng thái người dùng
  async updateUserStatus(userId: string, status: 'active' | 'inactive' | 'banned'): Promise<void> {
    await apiClient.patch(`/api/admin/users/${userId}/status`, { status });
  },

  // Cập nhật quyền người dùng
  async updateUserPermissions(userId: string, permissionIds: string[]): Promise<void> {
    await apiClient.put(`/api/admin/users/${userId}/permissions`, { permissionIds });
  },

  // Lấy danh sách quyền
  async getPermissions(): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get('/api/admin/permissions');
    return response.data;
  },

  // Kiểm tra đăng nhập
  // Endpoint này luôn trả về success: true, authenticated: true/false
  // Lưu ý: Middleware đã xử lý redirect tự động, hàm này chỉ dùng khi cần kiểm tra auth ở client-side
  async checkAuth(): Promise<{ success: boolean; authenticated: boolean; message: string; data?: { admin: any } }> {
    try {
      const response = await apiClient.get('/api/admin/check-auth');
      
      // Debug log (chỉ trong development)
      if (process.env.NODE_ENV === 'development') {
        console.log('Check auth API response:', {
          status: response.status,
          data: response.data,
          headers: response.headers,
        });
      }
      
      // Đảm bảo response có data
      if (!response || !response.data) {
        console.error('Invalid API response:', response);
        return {
          success: false,
          authenticated: false,
          message: 'Response không hợp lệ từ server',
        };
      }
      
      return {
        success: response.data?.success ?? true,
        authenticated: response.data?.authenticated ?? false,
        message: response.data?.message || '',
        data: response.data?.data,
      };
    } catch (error: any) {
      // Log lỗi chi tiết
      console.error('Check auth API error:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        code: error?.code,
      });
      
      // Nếu có lỗi, trả về authenticated: false
      return {
        success: false,
        authenticated: false,
        message: error?.response?.data?.message || error?.message || 'Không thể kiểm tra đăng nhập',
      };
    }
  },
};

// User API Functions
export const userApi = {
  // Đăng xuất user
  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/api/user/logout');
    return response.data;
  },
  // Đăng nhập user
  async login(email: string, password: string): Promise<{ success: boolean; message: string; data?: { user: any; token: string } }> {
    const response = await apiClient.post('/api/user/login', { email, password });
    return response.data;
  },

  // Đăng ký user
  async register(name: string, email: string, password: string): Promise<{ success: boolean; message: string; data?: { user: any } }> {
    const response = await apiClient.post('/api/user/register', { name, email, password });
    return response.data;
  },

  // Lấy thông tin user hiện tại
  async getCurrentUser(): Promise<{ success: boolean; message: string; data?: { user: any } }> {
    const response = await apiClient.get('/api/user/me');
    return response.data;
  },

  // Kiểm tra đăng nhập
  // Endpoint này luôn trả về success: true, authenticated: true/false
  // Lưu ý: Middleware đã xử lý redirect tự động, hàm này chỉ dùng khi cần kiểm tra auth ở client-side
  async checkAuth(): Promise<{ success: boolean; authenticated: boolean; message: string; data?: { user: any } }> {
    try {
      const response = await apiClient.get('/api/user/check-auth');
      
      // Debug log (chỉ trong development)
      if (process.env.NODE_ENV === 'development') {
        console.log('Check auth API response:', {
          status: response.status,
          data: response.data,
          headers: response.headers,
        });
      }
      
      // Đảm bảo response có data
      if (!response || !response.data) {
        console.error('Invalid API response:', response);
        return {
          success: false,
          authenticated: false,
          message: 'Response không hợp lệ từ server',
        };
      }
      
      return {
        success: response.data?.success ?? true,
        authenticated: response.data?.authenticated ?? false,
        message: response.data?.message || '',
        data: response.data?.data,
      };
    } catch (error: any) {
      // Log lỗi chi tiết
      console.error('Check auth API error:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        code: error?.code,
      });
      
      // Nếu có lỗi, trả về authenticated: false
      return {
        success: false,
        authenticated: false,
        message: error?.response?.data?.message || error?.message || 'Không thể kiểm tra đăng nhập',
      };
    }
  },
};

export const reviewsApi = {
  // Lấy tất cả reviews từ tất cả centers (admin)
  async getAllReviews(params?: {
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ success: boolean; data: Review[] }> {
    const response = await apiClient.get('/api/reviews', {
      params: {
        search: params?.search,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
      },
    });
    return response.data;
  },

  // Xóa review từ center (admin)
  async deleteReview(reviewId: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.delete(`/api/reviews/${reviewId}`);
    return response.data;
  },

  async getReviewsByUserId(userId: string): Promise<{ success: boolean; data: Review[] }> {
    const response = await apiClient.get(`/api/reviews/user/${userId}`);
    return response.data;
  },

  async getReviewsByCenterId(centerId: string): Promise<{ success: boolean; data: Review[] }> {
    const response = await apiClient.get(`/api/reviews/center/${centerId}`);
    return response.data;
  },
}

// Helper function để upload image và lấy URL
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert image to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

