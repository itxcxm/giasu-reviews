import axios from "axios";
import FormData from "form-data";
import { HTTP_STATUS } from "../utils/constants.js";

// Lớp UploadService chứa logic để tương tác với dịch vụ upload ảnh bên ngoài (upanhnhanh.com).
class UploadService {
  // Upload một ảnh từ chuỗi base64.
  // Thường dùng cho các client cũ hoặc các trường hợp không thể gửi file trực tiếp.
  async uploadImage(base64Image) {
    try {
      const API_URL = process.env.APIURL || "https://upanhnhanh.com/api/v1";
      const API_KEY = process.env.APIKEY;

      if (!API_KEY) {
        throw new Error("APIKEY cho dịch vụ upload ảnh chưa được cấu hình trong file .env");
      }

      // Tách chuỗi base64 và mime type nếu có.
      let base64Data = base64Image;
      let mimeType = "image/jpeg"; // Mặc định
      if (base64Image.includes(",")) {
        const parts = base64Image.split(",");
        base64Data = parts[1];
        const mimeMatch = parts[0].match(/data:([^;]+)/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
      }

      // Chuyển đổi chuỗi base64 thành Buffer.
      const imageBuffer = Buffer.from(base64Data, "base64");

      // Xác định phần mở rộng của file dựa trên mime type.
      const extensionMap = {
        "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/gif": "gif",
        "image/webp": "webp", "image/heic": "heic", "image/heif": "heif",
      };
      const extension = extensionMap[mimeType] || "jpg";

      // Tạo đối tượng FormData để gửi dữ liệu dạng multipart/form-data.
      const formData = new FormData();
      formData.append("images[]", imageBuffer, {
        filename: `image_${Date.now()}.${extension}`,
        contentType: mimeType,
      });

      // Tạo headers, bao gồm API key theo yêu cầu của dịch vụ.
      const headers = {
        ...formData.getHeaders(),
        "X-API-Key": API_KEY,
      };

      const uploadEndpoint = `${API_URL}/upload`;

      // Gửi request POST đến API upload.
      const response = await axios.post(uploadEndpoint, formData, {
        headers,
        maxContentLength: Infinity, // Không giới hạn kích thước content
        maxBodyLength: Infinity,
        timeout: 30000, // Timeout sau 30 giây
      });

      // Xử lý phản hồi từ API.
      if (response.data && response.data.success) {
        if (response.data.urls && response.data.urls.length > 0) {
          return response.data.urls[0];
        } else if (response.data.data && response.data.data.length > 0 && response.data.data[0].proxy_url) {
          return response.data.data[0].proxy_url;
        } else {
          throw new Error("API upload thành công nhưng không trả về URL ảnh.");
        }
      } else {
        const errorMessages = response.data?.errors || ["Lỗi không xác định từ API upload."];
        throw new Error(errorMessages.join(", "));
      }
    } catch (error) {
      console.error("Lỗi khi upload ảnh (base64):", error);
      this.handleUploadError(error); // Gọi hàm xử lý lỗi tập trung
    }
  }

  // Upload một file ảnh từ buffer (thường lấy từ multer).
  async uploadFile(fileBuffer, originalName, mimeType) {
    try {
      const API_URL = process.env.APIURL || "https://upanhnhanh.com/api/v1";
      const API_KEY = process.env.APIKEY;

      if (!API_KEY) {
        throw new Error("APIKEY cho dịch vụ upload ảnh chưa được cấu hình trong file .env");
      }
      
      const formData = new FormData();
      formData.append("images[]", fileBuffer, {
        filename: originalName || `image_${Date.now()}.jpg`,
        contentType: mimeType,
      });

      const headers = { ...formData.getHeaders(), "X-API-Key": API_KEY };
      const uploadEndpoint = `${API_URL}/upload`;

      const response = await axios.post(uploadEndpoint, formData, {
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000,
      });

      if (response.data && response.data.success) {
        if (response.data.urls && response.data.urls.length > 0) {
          return response.data.urls[0];
        } else if (response.data.data && response.data.data.length > 0 && response.data.data[0].proxy_url) {
          return response.data.data[0].proxy_url;
        } else {
          throw new Error("API upload thành công nhưng không trả về URL ảnh.");
        }
      } else {
        const errorMessages = response.data?.errors || ["Lỗi không xác định từ API upload."];
        throw new Error(errorMessages.join(", "));
      }
    } catch (error) {
      console.error("Lỗi khi upload file:", error);
      this.handleUploadError(error);
    }
  }

  // Upload nhiều file ảnh cùng lúc.
  async uploadMultipleFiles(files) {
    try {
      if (!Array.isArray(files) || files.length === 0) {
        return [];
      }

      const API_URL = process.env.APIURL || "https://upanhnhanh.com/api/v1";
      const API_KEY = process.env.APIKEY;

      if (!API_KEY) {
        throw new Error("APIKEY cho dịch vụ upload ảnh chưa được cấu hình trong file .env");
      }

      const formData = new FormData();
      for (const file of files) {
        if (file && file.buffer) {
          formData.append("images[]", file.buffer, {
            filename: file.originalname || `image_${Date.now()}.jpg`,
            contentType: file.mimetype || "image/jpeg",
          });
        }
      }

      const headers = { ...formData.getHeaders(), "X-API-Key": API_KEY };
      const uploadEndpoint = `${API_URL}/upload`;

      const response = await axios.post(uploadEndpoint, formData, {
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000, // Tăng timeout cho việc upload nhiều file
      });
      
      if (response.data && response.data.success) {
        let urls = [];
        if (response.data.urls && response.data.urls.length > 0) {
          urls = response.data.urls;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          urls = response.data.data.map(item => item.proxy_url).filter(Boolean);
        }
        return urls;
      } else {
        const errorMessages = response.data?.errors || ["Lỗi không xác định từ API upload."];
        throw new Error(errorMessages.join(", "));
      }
    } catch (error) {
      console.error("Lỗi khi upload nhiều file:", error);
      this.handleUploadError(error);
    }
  }

  // Upload nhiều ảnh từ chuỗi base64.
  async uploadMultipleImages(base64Images) {
    // Đây là một hàm phức tạp, có thể được đơn giản hóa bằng cách lặp và gọi `uploadImage`
    // hoặc xây dựng FormData tương tự như `uploadMultipleFiles`.
    // Để ngắn gọn, ta có thể triển khai bằng cách gọi `uploadImage` cho từng ảnh.
    const uploadPromises = base64Images.map(image => this.uploadImage(image));
    return Promise.all(uploadPromises);
  }

  // Hàm xử lý lỗi tập trung cho các phương thức upload.
  handleUploadError(error) {
    if (error.response) {
      // Lỗi đến từ phản hồi của server (ví dụ: 4xx, 5xx).
      console.error("Lỗi phản hồi từ API:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 401) {
        throw new Error("API key không hợp lệ hoặc bị thiếu. Vui lòng kiểm tra lại.");
      } else if (error.response.status === 429) {
        throw new Error("Bạn đã gửi quá nhiều yêu cầu upload. Vui lòng thử lại sau.");
      }

      const apiError = error.response.data?.error || error.response.data?.errors || "Lỗi không xác định từ dịch vụ upload.";
      const errorMessage = Array.isArray(apiError) ? apiError.join(", ") : apiError;
      throw new Error(`Lỗi upload ảnh: ${errorMessage}`);
    } else if (error.request) {
      // Request đã được gửi đi nhưng không nhận được phản hồi.
      throw new Error("Không thể kết nối đến dịch vụ upload ảnh. Vui lòng kiểm tra kết nối mạng và cấu hình APIURL.");
    } else {
      // Lỗi xảy ra trong quá trình thiết lập request.
      throw new Error(`Lỗi upload ảnh: ${error.message}`);
    }
  }
}

export const uploadService = new UploadService();
