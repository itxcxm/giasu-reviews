import { CentersService } from "../services/centersServices.js";
import { HTTP_STATUS } from "../utils/constants.js";
import { uploadService } from "../services/uploadService.js";

// Controller quản lý các thao tác với Centers
export class CentersController {
  constructor() {
    this.centersService = new CentersService();
  }

  // Lấy danh sách các trung tâm
  getCenters = async (req, res) => {
    try {
      // Lấy các tham số truy vấn từ request (search, xác thực, sắp xếp, phân trang)
      const {
        search = "",
        isVerified,
        sortBy = "createdAt",
        sortOrder = "desc",
        page = 1,
        limit = 10,
      } = req.query;

      // Tạo object options cho truy vấn
      const options = {
        search,
        isVerified: isVerified !== undefined ? isVerified : null,
        sortBy,
        sortOrder,
        page: parseInt(page),
        limit: parseInt(limit),
      };

      // Lấy dữ liệu trung tâm từ service
      const result = await this.centersService.getCenters({}, options);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.centers,
        pagination: result.pagination,
      });
    } catch (error) {
      // In ra log lỗi và trả về lỗi server
      console.error("Get centers error:", error);

      // Kiểm tra xem có phải lỗi database không
      if (
        error.name === "MongoServerSelectionError" ||
        error.name === "MongoNetworkError"
      ) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message:
            "Không thể kết nối đến database. Vui lòng kiểm tra MongoDB đã chạy chưa.",
        });
      }

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Lỗi khi lấy danh sách trung tâm",
      });
    }
  };

  // Lấy thông tin trung tâm theo ID
  getCenterById = async (req, res) => {
    try {
      // Lấy id từ params
      const { id } = req.params;

      if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "ID trung tâm không hợp lệ",
        });
      }

      // Lấy trung tâm từ service
      const center = await this.centersService.getCenterById(id);

      if (!center) {
        // Không tìm thấy trung tâm
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Không tìm thấy trung tâm",
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: center,
      });
    } catch (error) {
      // Xử lý lỗi server
      console.error("Get center by id error:", error);

      // Kiểm tra xem có phải lỗi database không
      if (
        error.name === "MongoServerSelectionError" ||
        error.name === "MongoNetworkError"
      ) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message:
            "Không thể kết nối đến database. Vui lòng kiểm tra MongoDB đã chạy chưa.",
        });
      }

      // Kiểm tra xem có phải lỗi ObjectId không hợp lệ không
      if (error.name === "CastError" && error.kind === "ObjectId") {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "ID trung tâm không hợp lệ",
        });
      }

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Lỗi khi lấy thông tin trung tâm",
      });
    }
  };

  // Tạo mới trung tâm
  createCenter = async (req, res) => {
    try {
      // Lấy dữ liệu từ body (text fields)
      const { name, address, phone, website } = req.body;
      // Lấy files từ multer (nếu có)
      const files = req.files || [];

      // Kiểm tra tên trung tâm bắt buộc nhập
      if (!name) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Tên trung tâm là bắt buộc",
        });
      }

      // Upload ảnh lên upanhnhanh.com nếu có
      let uploadedImageUrl = "";
      if (files && files.length > 0) {
        // Chỉ lấy ảnh đầu tiên cho center image
        const file = files[0];

        // Kiểm tra kích thước file không quá 10MB
        if (file.size > 10 * 1024 * 1024) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `Kích thước ảnh không được vượt quá 10MB. Hiện tại: ${(
              file.size /
              (1024 * 1024)
            ).toFixed(2)}MB`,
          });
        }

        // Upload file
        try {
          const uploadedUrls = await uploadService.uploadMultipleFiles([file]);
          if (uploadedUrls && uploadedUrls.length > 0) {
            uploadedImageUrl = uploadedUrls[0];
          }
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError);
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `Lỗi upload ảnh: ${uploadError.message}`,
          });
        }
      } else if (req.body.image && req.body.image.trim()) {
        // Backward compatibility: hỗ trợ base64 nếu không có file
        try {
          uploadedImageUrl = await uploadService.uploadImage(req.body.image);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `Lỗi upload ảnh: ${uploadError.message}`,
          });
        }
      }

      // Tạo object dữ liệu trung tâm
      const centerData = {
        name,
        address,
        phone,
        website,
        image: uploadedImageUrl || undefined,
      };

      // Gọi service tạo trung tâm mới
      const center = await this.centersService.createCenter(centerData);

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Tạo trung tâm thành công",
        data: center,
      });
    } catch (error) {
      // Nếu có lỗi, trả về lỗi 400 cùng message từ error
      console.error("Create center error:", error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message || "Lỗi khi tạo trung tâm",
      });
    }
  };

  // Cập nhật thông tin trung tâm
  updateCenter = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, address, phone, website, image } = req.body;

      // Thu thập các trường cần update
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (address !== undefined) updateData.address = address;
      if (phone !== undefined) updateData.phone = phone;
      if (website !== undefined) updateData.website = website;
      if (image !== undefined) updateData.image = image;

      // Gọi service để update
      const center = await this.centersService.updateCenter(id, updateData);

      if (!center) {
        // Không tìm thấy
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Không tìm thấy trung tâm",
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Cập nhật trung tâm thành công",
        data: center,
      });
    } catch (error) {
      // Trường hợp dữ liệu đầu vào không hợp lệ hoặc lỗi khác
      console.error("Update center error:", error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message || "Lỗi khi cập nhật trung tâm",
      });
    }
  };

  // Xóa trung tâm theo ID
  deleteCenter = async (req, res) => {
    try {
      const { id } = req.params;

      // Gọi service để xóa trung tâm
      const deleted = await this.centersService.deleteCenter(id);

      if (!deleted) {
        // Không tìm thấy hoặc xóa thất bại
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Không tìm thấy trung tâm",
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Xóa trung tâm thành công",
      });
    } catch (error) {
      // Nếu lỗi trong quá trình xóa
      console.error("Delete center error:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi khi xóa trung tâm",
      });
    }
  };

  // Thêm review cho trung tâm
  addReview = async (req, res) => {
    try {
      const { id } = req.params;
      // Lấy dữ liệu từ body (text fields)
      const { rating, comment, reviewerName } = req.body;
      // Lấy files từ multer (nếu có)
      const files = req.files || [];

      // Kiểm tra rating hợp lệ (từ 1 đến 5)
      if (!rating || rating < 1 || rating > 5) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Rating phải từ 1 đến 5",
        });
      }

      // Upload ảnh lên upanhnhanh.com nếu có
      let uploadedImageUrls = [];
      if (files && files.length > 0) {
        // Kiểm tra tổng kích thước tất cả file không quá 10MB
        let totalSize = 0;
        for (const file of files) {
          if (file && file.size) {
            totalSize += file.size;
          }
        }

        const maxTotalSize = 10 * 1024 * 1024; // 10MB
        if (totalSize > maxTotalSize) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `Tổng kích thước tất cả ảnh không được vượt quá 10MB. Hiện tại: ${(
              totalSize /
              (1024 * 1024)
            ).toFixed(2)}MB`,
          });
        }

        // Upload nhiều file
        try {
          uploadedImageUrls = await uploadService.uploadMultipleFiles(files);
        } catch (uploadError) {
          console.error("Error uploading files:", uploadError);
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `Lỗi upload ảnh: ${uploadError.message}`,
          });
        }
      } else if (images && Array.isArray(images) && images.length > 0) {
        // Backward compatibility: hỗ trợ base64 nếu không có file
        // Kiểm tra tổng kích thước base64 của tất cả ảnh không quá 10MB
        // Base64 thường lớn hơn file gốc khoảng 33%, nhưng để an toàn, kiểm tra kích thước base64
        let totalBase64Size = 0;
        for (const img of images) {
          if (img && typeof img === "string") {
            // Loại bỏ data:image prefix nếu có để tính kích thước chính xác
            const base64Data = img.includes(",") ? img.split(",")[1] : img;
            // Kích thước base64 (bytes) = (base64Length * 3) / 4
            totalBase64Size += (base64Data.length * 3) / 4;
          }
        }

        const maxTotalSize = 10 * 1024 * 1024; // 10MB
        if (totalBase64Size > maxTotalSize) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `Tổng kích thước tất cả ảnh không được vượt quá 10MB. Hiện tại: ${(
              totalBase64Size /
              (1024 * 1024)
            ).toFixed(2)}MB`,
          });
        }

        // Upload nhiều ảnh
        try {
          uploadedImageUrls = await uploadService.uploadMultipleImages(images);
        } catch (uploadError) {
          console.error("Error uploading images:", uploadError);
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `Lỗi upload ảnh: ${uploadError.message}`,
          });
        }
      } else if (image && image.trim()) {
        // Kiểm tra kích thước base64 của ảnh đơn không quá 10MB
        const base64Data = image.includes(",") ? image.split(",")[1] : image;
        const base64Size = (base64Data.length * 3) / 4;
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (base64Size > maxSize) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `Kích thước ảnh không được vượt quá 10MB. Hiện tại: ${(
              base64Size /
              (1024 * 1024)
            ).toFixed(2)}MB`,
          });
        }
        // Upload 1 ảnh (backward compatibility)
        try {
          const uploadedUrl = await uploadService.uploadImage(image);
          if (uploadedUrl) {
            uploadedImageUrls = [uploadedUrl];
          }
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `Lỗi upload ảnh: ${uploadError.message}`,
          });
        }
      }

      // Tạo object review data với URLs đã upload
      const reviewData = {
        rating: parseInt(rating),
        comment: comment || "",
        reviewerName: reviewerName || "",
        ...(uploadedImageUrls.length > 0 ? { images: uploadedImageUrls } : {}),
      };

      // Thêm review cho trung tâm
      const center = await this.centersService.addReview(id, reviewData);

      if (!center) {
        // Không tìm thấy trung tâm
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Không tìm thấy trung tâm",
        });
      }

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Thêm đánh giá thành công",
        data: center,
      });
    } catch (error) {
      // Lỗi khi thêm đánh giá
      console.error("Add review error:", error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message || "Lỗi khi thêm đánh giá",
      });
    }
  };

  // Xác thực (duyệt) trung tâm (dành cho admin)
  verifyCenter = async (req, res) => {
    try {
      const { id } = req.params;
      // Mặc định isVerified là true nếu không truyền vào
      const { isVerified = true } = req.body;

      // Gọi service duyệt trung tâm
      const center = await this.centersService.verifyCenter(
        id,
        isVerified === true || isVerified === "true"
      );

      if (!center) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Không tìm thấy trung tâm",
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: isVerified
          ? "Duyệt trung tâm thành công"
          : "Hủy duyệt trung tâm thành công",
        data: center,
      });
    } catch (error) {
      // Lỗi khi duyệt/hủy duyệt
      console.error("Verify center error:", error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message || "Lỗi khi duyệt trung tâm",
      });
    }
  };

  // Lấy tất cả đánh giá từ tất cả trung tâm (dành cho admin)
  getAllReviews = async (req, res) => {
    try {
      // Lấy các param lọc/sắp xếp
      const {
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const options = {
        search,
        sortBy,
        sortOrder,
      };

      // Lấy danh sách đánh giá từ service
      const reviews = await this.centersService.getAllReviews({}, options);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      // Xử lý lỗi khi lấy danh sách đánh giá
      console.error("Get all reviews error:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Lỗi khi lấy danh sách đánh giá",
      });
    }
  };

  // Xóa đánh giá khỏi trung tâm (dành cho admin)
  deleteReview = async (req, res) => {
    try {
      const { centerId, reviewId } = req.params;

      // Gọi service để xóa review khỏi trung tâm
      const center = await this.centersService.deleteReview(centerId, reviewId);

      if (!center) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Không tìm thấy trung tâm hoặc đánh giá",
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Xóa đánh giá thành công",
        data: center,
      });
    } catch (error) {
      // Lỗi khi xóa đánh giá
      console.error("Delete review error:", error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message || "Lỗi khi xóa đánh giá",
      });
    }
  };
}

// Export instance để sử dụng trong các routes
export const centersController = new CentersController();
