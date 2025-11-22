// API utility functions
import axios, { AxiosInstance, AxiosError } from 'axios';

// Lấy API URL từ environment variable hoặc dùng default
// Trong server-side rendering, có thể cần dùng 127.0.0.1 thay vì localhost
const getApiBaseUrl = () => {
  // Ưu tiên NEXT_PUBLIC_API_URL (available cả client và server)
  if (process.env.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL.trim();
    // Đảm bảo URL có protocol
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      console.warn('NEXT_PUBLIC_API_URL should include protocol (http:// or https://)');
      return `https://${url}`;
    }
    return url;
  }
  
  // Fallback cho server-side rendering
  if (typeof window === 'undefined') {
    return process.env.API_URL || 'http://127.0.0.1:5000';
  }
  
  // Fallback cho client-side (chỉ dùng trong development)
  // Trong production, NEXT_PUBLIC_API_URL phải được set
  if (process.env.NODE_ENV === 'production') {
    const errorMsg = '❌ NEXT_PUBLIC_API_URL is not set in production! This will cause API calls to fail. Please configure it in Vercel environment variables.';
    console.error(errorMsg);
    // Trong production, nếu không có API URL, throw error để dễ debug
    if (typeof window !== 'undefined') {
      console.error('Current window location:', window.location.href);
      console.error('Please set NEXT_PUBLIC_API_URL in Vercel Dashboard > Settings > Environment Variables');
    }
    // Trả về empty string để tránh gọi API sai
    return '';
  }
  
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

// Log để debug
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', API_BASE_URL);
} else if (typeof window !== 'undefined' && !API_BASE_URL) {
  // Cảnh báo trong production nếu API_BASE_URL không được set
  console.error('⚠️ API_BASE_URL is empty in production! All API calls will fail.');
  console.error('Please set NEXT_PUBLIC_API_URL in Vercel Dashboard > Settings > Environment Variables');
}

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
    // Đối với check-auth, không throw error nếu authenticated: false
    // Vì đó là trạng thái hợp lệ, không phải lỗi
    if (response.config.url?.includes('/check-auth')) {
      return response;
    }
    return response;
  },
  (error: AxiosError) => {
    // Xử lý lỗi chung
    if (error.response) {
      // Server trả về response với status code ngoài 2xx
      const responseData = error.response.data as any;
      const message = responseData?.message || error.message || 'Có lỗi xảy ra';
      
      // Đối với check-auth endpoint, nếu response có authenticated: false
      // thì không throw error vì đó là trạng thái hợp lệ
      if (error.config?.url?.includes('/check-auth') && responseData?.authenticated === false) {
        // Trả về response với authenticated: false thay vì throw error
        return Promise.resolve({
          ...error.response,
          data: responseData,
        } as any);
      }
      
      // Xử lý lỗi 404 đặc biệt
      if (error.response.status === 404) {
        return Promise.reject(new Error('Không tìm thấy trung tâm'));
      }
      
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request đã được gửi nhưng không nhận được response
      // Kiểm tra xem có phải lỗi kết nối không
      const errorCode = (error as any).code;
      const requestUrl = error.config?.url || '';
      
      console.error('API Request Error:', {
        code: errorCode,
        message: error.message,
        baseURL: API_BASE_URL,
        url: requestUrl,
      });
      
      // Nếu API_BASE_URL rỗng trong production, đây là lỗi cấu hình
      if (!API_BASE_URL && process.env.NODE_ENV === 'production') {
        return Promise.reject(new Error('NEXT_PUBLIC_API_URL chưa được cấu hình. Vui lòng kiểm tra environment variables trên Vercel.'));
      }
      
      if (errorCode === 'ECONNREFUSED' || errorCode === 'ERR_CONNECTION_REFUSED' || errorCode === 'ENOTFOUND' || errorCode === 'ETIMEDOUT') {
        return Promise.reject(new Error(`Không thể kết nối đến server tại ${API_BASE_URL || 'backend server'}. Vui lòng kiểm tra xem back-end server đã chạy chưa hoặc NEXT_PUBLIC_API_URL đã được cấu hình đúng chưa.`));
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
  // Endpoint này luôn trả về success: true, authenticated: true/false
  // Không throw error ngay cả khi chưa đăng nhập
  async checkAuth(): Promise<{ success: boolean; authenticated: boolean; message: string; data?: { admin: any } }> {
    try {
      const response = await apiClient.get('/api/admin/check-auth');
      // Đảm bảo response luôn có authenticated field
      return {
        success: response.data?.success ?? true,
        authenticated: response.data?.authenticated ?? false,
        message: response.data?.message || '',
        data: response.data?.data,
      };
    } catch (error: any) {
      // Nếu có lỗi kết nối, trả về authenticated: false thay vì throw error
      console.error('Check auth error:', error);
      return {
        success: false,
        authenticated: false,
        message: error?.message || 'Không thể kiểm tra đăng nhập',
      };
    }
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

