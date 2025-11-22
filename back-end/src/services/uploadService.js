import axios from "axios";
import FormData from "form-data";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Service để upload ảnh lên upanhnhanh.com
 */
class UploadService {
  /**
   * Upload một ảnh base64 lên upanhnhanh.com và trả về URL
   * @param {string} base64Image - Ảnh dưới dạng base64 (có thể có hoặc không có data:image prefix)
   * @returns {Promise<string>} - URL của ảnh sau khi upload
   */
  async uploadImage(base64Image) {
    try {
      const API_URL = process.env.APIURL || "https://upanhnhanh.com/api/v1";
      const API_KEY = process.env.APIKEY;

      if (!API_KEY) {
        throw new Error("APIKEY phải được cấu hình trong file .env");
      }

      // Loại bỏ data:image prefix nếu có
      let base64Data = base64Image;
      let mimeType = "image/jpeg";
      if (base64Image.includes(",")) {
        const parts = base64Image.split(",");
        base64Data = parts[1];
        // Lấy mime type từ data URL nếu có
        const mimeMatch = parts[0].match(/data:([^;]+)/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
      }

      // Convert base64 sang Buffer
      const imageBuffer = Buffer.from(base64Data, "base64");

      // Xác định extension từ mime type
      const extensionMap = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
        "image/heic": "heic",
        "image/heif": "heif",
      };
      const extension = extensionMap[mimeType] || "jpg";

      // Tạo FormData để upload
      // API yêu cầu sử dụng images[] thay vì file (theo tài liệu API)
      const formData = new FormData();
      formData.append("images[]", imageBuffer, {
        filename: `image_${Date.now()}.${extension}`,
        contentType: mimeType,
      });

      // Tạo headers với X-API-Key (theo tài liệu API)
      const headers = {
        ...formData.getHeaders(),
        "X-API-Key": API_KEY,
      };

      // Endpoint upload
      const uploadEndpoint = `${API_URL}/upload`;

      // Gửi request upload lên API
      const response = await axios.post(uploadEndpoint, formData, {
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000, // 30 giây timeout
      });

      // Xử lý response theo tài liệu API
      if (response.data && response.data.success) {
        // Lấy URL từ urls array (ưu tiên) hoặc từ data[].proxy_url
        if (response.data.urls && response.data.urls.length > 0) {
          return response.data.urls[0];
        } else if (
          response.data.data &&
          response.data.data.length > 0 &&
          response.data.data[0].proxy_url
        ) {
          return response.data.data[0].proxy_url;
        } else {
          throw new Error("API trả về success nhưng không có URL");
        }
      } else {
        // Xử lý lỗi từ API
        const errorMessages = response.data?.errors || [
          "Lỗi không xác định từ API",
        ];
        throw new Error(errorMessages.join(", "));
      }
    } catch (error) {
      console.error("Upload image error:", error);
      if (error.response) {
        // Log chi tiết lỗi từ API
        console.error("API Response Error:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });

        // Xử lý các mã lỗi đặc biệt
        if (error.response.status === 401) {
          throw new Error(
            "API key không hợp lệ hoặc thiếu. Vui lòng kiểm tra APIKEY trong .env"
          );
        } else if (error.response.status === 429) {
          const errorMsg =
            error.response.data?.error ||
            "Quá nhiều requests. Vui lòng thử lại sau.";
          throw new Error(`Lỗi upload ảnh: ${errorMsg}`);
        }

        // Xử lý lỗi từ response
        const errorMessages = error.response.data?.errors ||
          error.response.data?.error || [
            error.response.statusText || "Lỗi không xác định từ API",
          ];
        throw new Error(
          `Lỗi upload ảnh: ${
            Array.isArray(errorMessages)
              ? errorMessages.join(", ")
              : errorMessages
          }`
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
        throw new Error(
          "Không thể kết nối đến API upload ảnh. Vui lòng kiểm tra APIURL trong .env"
        );
      } else {
        throw new Error(`Lỗi upload ảnh: ${error.message}`);
      }
    }
  }

  /**
   * Upload một file ảnh lên upanhnhanh.com và trả về URL
   * @param {Buffer} fileBuffer - Buffer của file ảnh
   * @param {string} originalName - Tên file gốc
   * @param {string} mimeType - MIME type của file
   * @returns {Promise<string>} - URL của ảnh sau khi upload
   */
  async uploadFile(fileBuffer, originalName, mimeType) {
    try {
      const API_URL = process.env.APIURL || "https://upanhnhanh.com/api/v1";
      const API_KEY = process.env.APIKEY;

      if (!API_KEY) {
        throw new Error("APIKEY phải được cấu hình trong file .env");
      }

      // Xác định extension từ mime type hoặc tên file
      const extensionMap = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
        "image/heic": "heic",
        "image/heif": "heif",
      };
      const extension =
        extensionMap[mimeType] || originalName.split(".").pop() || "jpg";

      // Tạo FormData để upload
      const formData = new FormData();
      formData.append("images[]", fileBuffer, {
        filename: originalName || `image_${Date.now()}.${extension}`,
        contentType: mimeType,
      });

      // Tạo headers với X-API-Key
      const headers = {
        ...formData.getHeaders(),
        "X-API-Key": API_KEY,
      };

      // Endpoint upload
      const uploadEndpoint = `${API_URL}/upload`;

      // Gửi request upload lên API
      const response = await axios.post(uploadEndpoint, formData, {
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000, // 30 giây timeout
      });

      // Xử lý response theo tài liệu API
      if (response.data && response.data.success) {
        // Lấy URL từ urls array (ưu tiên) hoặc từ data[].proxy_url
        if (response.data.urls && response.data.urls.length > 0) {
          return response.data.urls[0];
        } else if (
          response.data.data &&
          response.data.data.length > 0 &&
          response.data.data[0].proxy_url
        ) {
          return response.data.data[0].proxy_url;
        } else {
          throw new Error("API trả về success nhưng không có URL");
        }
      } else {
        // Xử lý lỗi từ API
        const errorMessages = response.data?.errors || [
          "Lỗi không xác định từ API",
        ];
        throw new Error(errorMessages.join(", "));
      }
    } catch (error) {
      console.error("Upload file error:", error);
      if (error.response) {
        // Log chi tiết lỗi từ API
        console.error("API Response Error:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });

        // Xử lý các mã lỗi đặc biệt
        if (error.response.status === 401) {
          throw new Error(
            "API key không hợp lệ hoặc thiếu. Vui lòng kiểm tra APIKEY trong .env"
          );
        } else if (error.response.status === 429) {
          const errorMsg =
            error.response.data?.error ||
            "Quá nhiều requests. Vui lòng thử lại sau.";
          throw new Error(`Lỗi upload ảnh: ${errorMsg}`);
        }

        // Xử lý lỗi từ response
        const errorMessages = error.response.data?.errors ||
          error.response.data?.error || [
            error.response.statusText || "Lỗi không xác định từ API",
          ];
        throw new Error(
          `Lỗi upload ảnh: ${
            Array.isArray(errorMessages)
              ? errorMessages.join(", ")
              : errorMessages
          }`
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
        throw new Error(
          "Không thể kết nối đến API upload ảnh. Vui lòng kiểm tra APIURL trong .env"
        );
      } else {
        throw new Error(`Lỗi upload ảnh: ${error.message}`);
      }
    }
  }

  /**
   * Upload nhiều file ảnh lên upanhnhanh.com và trả về mảng URL
   * @param {Express.Multer.File[]} files - Mảng các file từ multer
   * @returns {Promise<string[]>} - Mảng các URL của ảnh sau khi upload
   */
  async uploadMultipleFiles(files) {
    try {
      if (!Array.isArray(files) || files.length === 0) {
        return [];
      }

      const API_URL = process.env.APIURL || "https://upanhnhanh.com/api/v1";
      const API_KEY = process.env.APIKEY;

      if (!API_KEY) {
        throw new Error("APIKEY phải được cấu hình trong file .env");
      }

      // Tạo FormData với nhiều ảnh (theo tài liệu API: images[])
      const formData = new FormData();

      // Thêm tất cả file vào FormData
      for (const file of files) {
        if (file && file.buffer) {
          formData.append("images[]", file.buffer, {
            filename: file.originalname || `image_${Date.now()}.jpg`,
            contentType: file.mimetype || "image/jpeg",
          });
        }
      }

      // Tạo headers với X-API-Key
      const headers = {
        ...formData.getHeaders(),
        "X-API-Key": API_KEY,
      };

      // Endpoint upload
      const uploadEndpoint = `${API_URL}/upload`;

      // Gửi request upload lên API (upload tất cả ảnh cùng lúc)
      const response = await axios.post(uploadEndpoint, formData, {
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000, // 30 giây timeout
      });

      // Xử lý response theo tài liệu API
      if (response.data && response.data.success) {
        // Lấy URLs từ urls array (ưu tiên) hoặc từ data[].proxy_url
        const urls = [];
        if (response.data.urls && response.data.urls.length > 0) {
          urls.push(...response.data.urls);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Lấy từ data[].proxy_url
          response.data.data.forEach((item) => {
            if (item.proxy_url) {
              urls.push(item.proxy_url);
            }
          });
        }

        return urls.filter((url) => url); // Loại bỏ các URL null/undefined
      } else {
        // Xử lý lỗi từ API
        const errorMessages = response.data?.errors || [
          "Lỗi không xác định từ API",
        ];
        throw new Error(errorMessages.join(", "));
      }
    } catch (error) {
      console.error("Upload multiple files error:", error);
      if (error.response) {
        // Log chi tiết lỗi từ API
        console.error("API Response Error:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
        // Xử lý các mã lỗi đặc biệt
        if (error.response.status === 401) {
          throw new Error(
            "API key không hợp lệ hoặc thiếu. Vui lòng kiểm tra APIKEY trong .env"
          );
        } else if (error.response.status === 429) {
          const errorMsg =
            error.response.data?.error ||
            "Quá nhiều requests. Vui lòng thử lại sau.";
          throw new Error(`Lỗi upload ảnh: ${errorMsg}`);
        }

        const errorMessages = error.response.data?.errors ||
          error.response.data?.error || [
            error.response.statusText || "Lỗi không xác định từ API",
          ];
        throw new Error(
          `Lỗi upload ảnh: ${
            Array.isArray(errorMessages)
              ? errorMessages.join(", ")
              : errorMessages
          }`
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
        throw new Error(
          "Không thể kết nối đến API upload ảnh. Vui lòng kiểm tra APIURL trong .env"
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Upload nhiều ảnh base64 lên upanhnhanh.com và trả về mảng URL (backward compatibility)
   * @param {string[]} base64Images - Mảng các ảnh dưới dạng base64
   * @returns {Promise<string[]>} - Mảng các URL của ảnh sau khi upload
   */
  async uploadMultipleImages(base64Images) {
    try {
      if (!Array.isArray(base64Images) || base64Images.length === 0) {
        return [];
      }

      const API_URL = process.env.APIURL || "https://upanhnhanh.com/api/v1";
      const API_KEY = process.env.APIKEY;

      if (!API_KEY) {
        throw new Error("APIKEY phải được cấu hình trong file .env");
      }

      // Tạo FormData với nhiều ảnh (theo tài liệu API: images[])
      const formData = new FormData();

      // Xử lý từng ảnh và thêm vào FormData
      for (let i = 0; i < base64Images.length; i++) {
        const base64Image = base64Images[i];
        if (!base64Image || !base64Image.trim()) continue;

        // Loại bỏ data:image prefix nếu có
        let base64Data = base64Image;
        let mimeType = "image/jpeg";
        if (base64Image.includes(",")) {
          const parts = base64Image.split(",");
          base64Data = parts[1];
          // Lấy mime type từ data URL nếu có
          const mimeMatch = parts[0].match(/data:([^;]+)/);
          if (mimeMatch) {
            mimeType = mimeMatch[1];
          }
        }

        // Convert base64 sang Buffer
        const imageBuffer = Buffer.from(base64Data, "base64");

        // Xác định extension từ mime type
        const extensionMap = {
          "image/jpeg": "jpg",
          "image/jpg": "jpg",
          "image/png": "png",
          "image/gif": "gif",
          "image/webp": "webp",
          "image/heic": "heic",
          "image/heif": "heif",
        };
        const extension = extensionMap[mimeType] || "jpg";

        // Thêm ảnh vào FormData với key images[]
        formData.append("images[]", imageBuffer, {
          filename: `image_${Date.now()}_${i}.${extension}`,
          contentType: mimeType,
        });
      }

      // Tạo headers với X-API-Key
      const headers = {
        ...formData.getHeaders(),
        "X-API-Key": API_KEY,
      };

      // Endpoint upload
      const uploadEndpoint = `${API_URL}/upload`;

      // Gửi request upload lên API (upload tất cả ảnh cùng lúc)
      const response = await axios.post(uploadEndpoint, formData, {
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000, // 30 giây timeout
      });

      // Xử lý response theo tài liệu API
      if (response.data && response.data.success) {
        // Lấy URLs từ urls array (ưu tiên) hoặc từ data[].proxy_url
        const urls = [];
        if (response.data.urls && response.data.urls.length > 0) {
          urls.push(...response.data.urls);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Lấy từ data[].proxy_url
          response.data.data.forEach((item) => {
            if (item.proxy_url) {
              urls.push(item.proxy_url);
            }
          });
        }

        return urls.filter((url) => url); // Loại bỏ các URL null/undefined
      } else {
        // Xử lý lỗi từ API
        const errorMessages = response.data?.errors || [
          "Lỗi không xác định từ API",
        ];
        throw new Error(errorMessages.join(", "));
      }
    } catch (error) {
      console.error("Upload multiple images error:", error);
      if (error.response) {
        // Log chi tiết lỗi từ API
        console.error("API Response Error:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
        // Xử lý các mã lỗi đặc biệt
        if (error.response.status === 401) {
          throw new Error(
            "API key không hợp lệ hoặc thiếu. Vui lòng kiểm tra APIKEY trong .env"
          );
        } else if (error.response.status === 429) {
          const errorMsg =
            error.response.data?.error ||
            "Quá nhiều requests. Vui lòng thử lại sau.";
          throw new Error(`Lỗi upload ảnh: ${errorMsg}`);
        }

        const errorMessages = error.response.data?.errors ||
          error.response.data?.error || [
            error.response.statusText || "Lỗi không xác định từ API",
          ];
        throw new Error(
          `Lỗi upload ảnh: ${
            Array.isArray(errorMessages)
              ? errorMessages.join(", ")
              : errorMessages
          }`
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
        throw new Error(
          "Không thể kết nối đến API upload ảnh. Vui lòng kiểm tra APIURL trong .env"
        );
      } else {
        throw error;
      }
    }
  }
}

export const uploadService = new UploadService();
