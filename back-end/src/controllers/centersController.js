import { CentersService } from "../services/centersService.js";
import { HTTP_STATUS } from "../utils/constants.js";
import { uploadService } from "../services/uploadService.js";
import User from "../models/User.js";

/**
 * Khởi tạo service xử lý nghiệp vụ liên quan đến trung tâm
 */
const centersService = new CentersService();

/**
 * CentersController
 * -----------------
 * Chịu trách nhiệm xử lý request/response cho các chức năng liên quan đến:
 * - Trung tâm đào tạo
 * - Đánh giá trung tâm
 * - Duyệt trung tâm (admin)
 */
export class CentersController {
  constructor() {
    this.centersService = centersService;
  }

  /**
   * Lấy danh sách trung tâm đã được duyệt (public)
   * - Có phân trang
   * - Dùng cho trang chủ / trang danh sách công khai
   */
  getAllCenters = async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
      };

      const result = await this.centersService.getAllCenters(options);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.centers,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách trung tâm công khai:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Không thể lấy danh sách trung tâm.",
      });
    }
  };

  /**
   * Lấy danh sách trung tâm cho trang quản trị
   * - Hỗ trợ tìm kiếm, lọc, sắp xếp
   * - Có phân trang
   */
  getCenters = async (req, res) => {
    try {
      const {
        search = "",
        isVerified,
        sortBy = "createdAt",
        sortOrder = "desc",
        page = 1,
        limit = 10,
      } = req.query;

      const options = {
        search,
        isVerified: isVerified !== undefined ? isVerified : null,
        sortBy,
        sortOrder,
        page: parseInt(page),
        limit: parseInt(limit),
      };

      const result = await this.centersService.getCenters({}, options);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.centers,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách trung tâm (admin):", error);

      // Xử lý lỗi kết nối MongoDB
      if (
        error.name === "MongoServerSelectionError" ||
        error.name === "MongoNetworkError"
      ) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Không thể kết nối cơ sở dữ liệu. Vui lòng thử lại sau.",
        });
      }

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Không thể lấy danh sách trung tâm.",
      });
    }
  };

  /**
   * Lấy chi tiết thông tin một trung tâm theo ID
   */
  getCenterById = async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "ID trung tâm là bắt buộc.",
        });
      }

      const center = await this.centersService.getCenterById(id);

      if (!center) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Không tìm thấy trung tâm.",
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: center,
      });
    } catch (error) {
      console.error("Lỗi khi lấy trung tâm theo ID:", error);

      // ID không hợp lệ (Mongo ObjectId)
      if (error.name === "CastError") {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "ID trung tâm không hợp lệ.",
        });
      }

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Không thể lấy thông tin trung tâm.",
      });
    }
  };

  /**
   * Tạo mới một trung tâm
   * - Hỗ trợ upload ảnh: multipart/form-data hoặc base64
   * - Admin tạo -> duyệt ngay
   * - User tạo -> chờ duyệt
   */
  createCenter = async (req, res) => {
    try {
      const { name, address, phone, website } = req.body;
      const file = req.file;

      if (!name) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Tên trung tâm là bắt buộc.",
        });
      }

      let uploadedImageUrl;

      // Upload ảnh từ multipart/form-data
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: "Kích thước ảnh không được vượt quá 10MB.",
          });
        }

        uploadedImageUrl = await uploadService.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype
        );
      }
      // Upload ảnh từ base64
      else if (req.body.image?.trim()) {
        uploadedImageUrl = await uploadService.uploadImage(req.body.image);
      }

      const centerData = {
        name,
        address,
        phone,
        website,
        image: uploadedImageUrl,
        isVerified: req.user?.role === "admin",
      };

      const center = await this.centersService.createCenter(centerData);

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message:
          "Tạo trung tâm thành công. Trung tâm sẽ hiển thị sau khi được duyệt.",
        data: center,
      });
    } catch (error) {
      console.error("Lỗi khi tạo trung tâm:", error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message || "Không thể tạo trung tâm.",
      });
    }
  };

  /**
   * Cập nhật thông tin trung tâm
   * - Cho phép cập nhật từng trường
   * - Hỗ trợ thay đổi ảnh (URL hoặc base64)
   */
  updateCenter = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, address, phone, website, image } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (address !== undefined) updateData.address = address;
      if (phone !== undefined) updateData.phone = phone;
      if (website !== undefined) updateData.website = website;

      if (image !== undefined) {
        if (typeof image === "string" && image.startsWith("data:image/")) {
          updateData.image = await uploadService.uploadImage(image);
        } else {
          updateData.image = image;
        }
      }

      const center = await this.centersService.updateCenter(id, updateData);

      if (!center) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Không tìm thấy trung tâm.",
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Cập nhật trung tâm thành công.",
        data: center,
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật trung tâm:", error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message || "Không thể cập nhật trung tâm.",
      });
    }
  };

  /**
   * Xóa trung tâm theo ID
   */
  deleteCenter = async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await this.centersService.deleteCenter(id);

      if (!deleted) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Không tìm thấy trung tâm.",
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Xóa trung tâm thành công.",
      });
    } catch (error) {
      console.error("Lỗi khi xóa trung tâm:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Không thể xóa trung tâm.",
      });
    }
  };

  /**
   * Thêm đánh giá cho trung tâm
   * - Yêu cầu đăng nhập
   * - Hỗ trợ nhiều hình ảnh (file hoặc base64)
   * - Rating giới hạn từ 1–5
   */
  addReview = async (req, res) => {
    try {
      const { id } = req.params;
      const { comment, rating = 5, images, image } = req.body;
      const files = req.files || [];
      const userId = req.user?.id;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Vui lòng đăng nhập để đánh giá.",
        });
      }

      let uploadedImageUrls = [];

      if (files.length > 0) {
        uploadedImageUrls = await uploadService.uploadMultipleFiles(files);
      } else if (Array.isArray(images)) {
        uploadedImageUrls = await uploadService.uploadMultipleImages(images);
      } else if (image?.trim()) {
        uploadedImageUrls = [await uploadService.uploadImage(image)];
      }

      const parsedRating = Math.max(1, Math.min(5, Number(rating) || 5));

      const reviewData = {
        rating: parsedRating,
        comment: comment?.trim(),
        images: uploadedImageUrls,
        user: userId,
      };

      const newReview = await this.centersService.addReview(id, reviewData);

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Thêm đánh giá thành công.",
        data: newReview,
      });
    } catch (error) {
      console.error("Lỗi khi thêm đánh giá:", error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message || "Không thể thêm đánh giá.",
      });
    }
  };

  /**
   * Duyệt hoặc hủy duyệt trung tâm (admin)
   */
  verifyCenter = async (req, res) => {
    try {
      const { id } = req.params;
      const { isVerified = true } = req.body;

      const center = await this.centersService.verifyCenter(
        id,
        isVerified === true || isVerified === "true"
      );

      if (!center) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Không tìm thấy trung tâm.",
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: isVerified
          ? "Duyệt trung tâm thành công."
          : "Hủy duyệt trung tâm thành công.",
        data: center,
      });
    } catch (error) {
      console.error("Lỗi khi duyệt trung tâm:", error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message || "Không thể duyệt trung tâm.",
      });
    }
  };

  /**
   * Lấy tất cả đánh giá (admin)
   */
  getAllReviews = async (req, res) => {
    try {
      const { search = "", sortBy = "createdAt", sortOrder = "desc" } = req.query;

      const reviews = await this.centersService.getAllReviews({}, {
        search,
        sortBy,
        sortOrder,
      });

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đánh giá:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Không thể lấy danh sách đánh giá.",
      });
    }
  };

  /**
   * Xóa đánh giá khỏi trung tâm (admin)
   */
  deleteReview = async (req, res) => {
    try {
      const { centerId, reviewId } = req.params;

      const success = await this.centersService.deleteReview(centerId, reviewId);

      if (!success) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Không tìm thấy đánh giá hoặc trung tâm.",
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Xóa đánh giá thành công.",
      });
    } catch (error) {
      console.error("Lỗi khi xóa đánh giá:", error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message || "Không thể xóa đánh giá.",
      });
    }
  };
}

/**
 * Export instance để sử dụng trong routes
 */
export const centersController = new CentersController();
