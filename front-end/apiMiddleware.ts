import { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Check if we're in browser environment
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Redirect to login page
 */
const redirectToLogin = () => {
  if (isBrowser && !window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
};

/**
 * Setup request interceptors for axios instance
 * Handles: token injection, logging, etc.
 */
export const setupRequestInterceptor = (apiClient: AxiosInstance) => {
  apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Có thể thêm logic xử lý request ở đây
      // Ví dụ: thêm token vào header, logging, etc.
      
      // Log request trong development
      if (process.env.NODE_ENV === 'development') {
        console.log('API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
        });
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

/**
 * Setup response interceptors for axios instance
 * Handles: error processing, authentication checks, etc.
 */
export const setupResponseInterceptor = (apiClient: AxiosInstance) => {
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
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      const requestUrl = originalRequest?.url || '';
      const isCheckAuthEndpoint = requestUrl.includes('/check-auth');
      
      // Xử lý lỗi chung
      if (error.response) {
        // Server trả về response với status code ngoài 2xx
        const status = error.response.status;
        const responseData = error.response.data as any;
        const message = responseData?.message || error.message || 'Có lỗi xảy ra';
        
        // Xử lý lỗi 401 (Unauthorized) - Token hết hạn hoặc không hợp lệ
        if (status === 401) {
          // Đối với check-auth endpoint, không redirect và không throw error
          // Vì đó là trạng thái hợp lệ khi chưa đăng nhập
          if (isCheckAuthEndpoint) {
            // Trả về response với authenticated: false
            return Promise.resolve({
              ...error.response,
              data: {
                success: true,
                authenticated: false,
                message: 'Chưa đăng nhập',
              },
            } as any);
          }
          
          // Đối với các endpoint khác, redirect về login
          if (isBrowser && !window.location.pathname.includes('/login')) {
            redirectToLogin();
          }
          
          return Promise.reject(new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
        }
        
        // Xử lý lỗi 403 (Forbidden) - Không có quyền truy cập
        if (status === 403) {
          if (isCheckAuthEndpoint) {
            return Promise.resolve({
              ...error.response,
              data: {
                success: true,
                authenticated: false,
                message: 'Không có quyền truy cập',
              },
            } as any);
          }
          
          if (isBrowser && !window.location.pathname.includes('/login')) {
            redirectToLogin();
          }
          
          return Promise.reject(new Error('Bạn không có quyền truy cập tài nguyên này.'));
        }
        
        // Đối với check-auth endpoint với các status code khác
        // Nếu response có authenticated: false thì không throw error
        if (isCheckAuthEndpoint && responseData?.authenticated === false) {
          return Promise.resolve({
            ...error.response,
            data: {
              success: true,
              authenticated: false,
              message: responseData?.message || 'Chưa đăng nhập',
              ...responseData,
            },
          } as any);
        }
        
        // Xử lý lỗi 404 đặc biệt
        if (status === 404) {
          return Promise.reject(new Error('Không tìm thấy trung tâm'));
        }
        
        return Promise.reject(new Error(message));
      } else if (error.request) {
        // Request đã được gửi nhưng không nhận được response
        // Kiểm tra xem có phải lỗi kết nối không
        const errorCode = (error as any).code;
        const baseURL = originalRequest?.baseURL || '';
        
        console.error('API Request Error:', {
          code: errorCode,
          message: error.message,
          baseURL: baseURL,
          url: requestUrl,
        });
        
        // Đối với check-auth endpoint, nếu có lỗi kết nối
        // Trả về authenticated: false thay vì throw error
        if (isCheckAuthEndpoint) {
          return Promise.resolve({
            status: 200,
            statusText: 'OK',
            data: {
              success: false,
              authenticated: false,
              message: 'Không thể kết nối đến server',
            },
            config: originalRequest,
          } as any);
        }
        
        // Nếu API_BASE_URL rỗng trong production, đây là lỗi cấu hình
        if (!baseURL && process.env.NODE_ENV === 'production') {
          return Promise.reject(new Error('NEXT_PUBLIC_API_URL chưa được cấu hình. Vui lòng kiểm tra environment variables trên Vercel.'));
        }
        
        if (errorCode === 'ECONNREFUSED' || errorCode === 'ERR_CONNECTION_REFUSED' || errorCode === 'ENOTFOUND' || errorCode === 'ETIMEDOUT') {
          return Promise.reject(new Error(`Không thể kết nối đến server tại ${baseURL || 'backend server'}. Vui lòng kiểm tra xem back-end server đã chạy chưa hoặc NEXT_PUBLIC_API_URL đã được cấu hình đúng chưa.`));
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
};

/**
 * Setup all interceptors for axios instance
 * @param apiClient - Axios instance to setup interceptors for
 */
export const setupApiMiddleware = (apiClient: AxiosInstance) => {
  setupRequestInterceptor(apiClient);
  setupResponseInterceptor(apiClient);
};

