import { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

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
        const baseURL = error.config?.baseURL || '';
        
        console.error('API Request Error:', {
          code: errorCode,
          message: error.message,
          baseURL: baseURL,
          url: requestUrl,
        });
        
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

