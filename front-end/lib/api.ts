// API utility functions
import axios, { AxiosInstance, AxiosError } from 'axios';

// Lấy API URL từ environment variable hoặc dùng default
// Trong server-side rendering, có thể cần dùng 127.0.0.1 thay vì localhost
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Trong server-side, có thể cần dùng 127.0.0.1
  if (typeof window === 'undefined') {
    // Server-side rendering
    return process.env.API_URL || 'http://127.0.0.1:5000';
  }
  // Client-side
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

// Tạo axios instance với cấu hình mặc định
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Tương đương với credentials: 'include'
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 giây timeout
});

// Request interceptor - có thể thêm token, logging, etc.
apiClient.interceptors.request.use(
  (config) => {
    // Có thể thêm logic xử lý request ở đây
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - xử lý errors chung
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Xử lý lỗi chung
    if (error.response) {
      // Server trả về response với status code ngoài 2xx
      const message = (error.response.data as any)?.message || error.message || 'Có lỗi xảy ra';
      
      // Xử lý lỗi 404 đặc biệt
      if (error.response.status === 404) {
        return Promise.reject(new Error('Không tìm thấy trung tâm'));
      }
      
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request đã được gửi nhưng không nhận được response
      // Kiểm tra xem có phải lỗi kết nối không
      const errorCode = (error as any).code;
      console.error('API Request Error:', {
        code: errorCode,
        message: error.message,
        baseURL: API_BASE_URL,
        url: error.config?.url,
      });
      
      if (errorCode === 'ECONNREFUSED' || errorCode === 'ERR_CONNECTION_REFUSED' || errorCode === 'ENOTFOUND' || errorCode === 'ETIMEDOUT') {
        return Promise.reject(new Error(`Không thể kết nối đến server tại ${API_BASE_URL}. Vui lòng kiểm tra xem back-end server đã chạy chưa.`));
      }
      if (errorCode === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return Promise.reject(new Error('Request timeout. Server không phản hồi trong thời gian cho phép.'));
      }
      return Promise.reject(new Error(`Không thể kết nối đến server: ${error.message || 'Unknown error'}`));
    } else {
      // Có lỗi khi setup request
      return Promise.reject(error);
    }
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
  reviewCount: number;
  isVerified?: boolean;
  reviews?: Review[];
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
  reviewerName?: string;
  createdAt?: string;
  updatedAt?: string;
  centerId?: string;
  centerName?: string;
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
  reviewerName?: string;
}

// API Functions
export const centersAPI = {
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
  async createCenter(data: CreateCenterData & { imageFile?: File }): Promise<{ success: boolean; data: Center; message?: string }> {
    // Nếu có file, gửi dưới dạng FormData
    if (data.imageFile) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('address', data.address || '');
      formData.append('phone', data.phone || '');
      formData.append('website', data.website || '');
      formData.append('image', data.imageFile); // 'image' cho single file upload

      const response = await apiClient.post('/api/centers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // Gửi dưới dạng JSON (backward compatibility với base64)
      const response = await apiClient.post('/api/centers', data);
      return response.data;
    }
  },

  // Thêm review cho center
  async addReview(centerId: string, data: CreateReviewData & { images?: File[] }): Promise<{ success: boolean; data: Center; message?: string }> {
    // Nếu có files, gửi dưới dạng FormData
    if (data.images && data.images.length > 0) {
      const formData = new FormData();
      formData.append('rating', data.rating.toString());
      formData.append('comment', data.comment || '');
      formData.append('reviewerName', data.reviewerName || '');
      
      // Thêm tất cả files vào FormData
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
      // Gửi dưới dạng JSON (backward compatibility)
      const response = await apiClient.post(`/api/centers/${centerId}/reviews`, data);
      return response.data;
    }
  },

  // Lấy tất cả reviews từ tất cả centers (admin)
  async getAllReviews(params?: {
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ success: boolean; data: Review[] }> {
    const response = await apiClient.get('/api/centers/reviews/all', {
      params: {
        search: params?.search,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
      },
    });
    return response.data;
  },

  // Xóa review từ center (admin)
  async deleteReview(centerId: string, reviewId: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.delete(`/api/centers/${centerId}/reviews/${reviewId}`);
    return response.data;
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
export const adminAPI = {
  // Đăng nhập admin
  async login(email: string, password: string): Promise<{ success: boolean; message: string; data?: { admin: any } }> {
    const response = await apiClient.post('/api/admin/login', { email, password });
    return response.data;
  },

  // Đăng ký admin
  async register(name: string, email: string, password: string): Promise<{ success: boolean; message: string; data?: { admin: any } }> {
    const response = await apiClient.post('/api/admin/register', { name, email, password });
    return response.data;
  },

  // Lấy thông tin admin hiện tại
  async getCurrentAdmin(): Promise<{ success: boolean; message: string; data?: { admin: any } }> {
    const response = await apiClient.get('/api/admin/me');
    return response.data;
  },

  // Kiểm tra đăng nhập
  async checkAuth(): Promise<{ success: boolean; authenticated: boolean; message: string; data?: { admin: any } }> {
    const response = await apiClient.get('/api/admin/check-auth');
    return response.data;
  },
};

// Helper function để upload image và lấy URL
// Note: Hiện tại backend chưa có endpoint upload image, nên tạm thời convert sang base64
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

