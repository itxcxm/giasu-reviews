import { CentersRepository } from "../repositories/centersRepository.js";

// Lớp CentersService chứa business logic cho các hoạt động liên quan đến trung tâm.
// Nó hoạt động như một lớp trung gian giữa Controller và Repository.
export class CentersService {
  constructor() {
    this.centersRepository = new CentersRepository();
  }

  // Lấy danh sách các trung tâm, chuyển tiếp yêu cầu đến repository.
  async getCenters(filters = {}, options = {}) {
    try {
      const result = await this.centersRepository.findAll(filters, options);
      return result;
    } catch (error) {
      console.error("Lỗi ở service khi lấy danh sách trung tâm:", error);
      throw error;
    }
  }

  // Lấy tất cả các trung tâm (thường dành cho admin), chuyển tiếp yêu cầu.
  async getAllCenters(filters = {}, options = {}) {
    try {
      const result = await this.centersRepository.findAll(filters, options);
      return result;
    } catch (error) {
      console.error("Lỗi ở service khi lấy tất cả trung tâm:", error);
      throw error;
    }
  }

  // Lấy thông tin chi tiết một trung tâm theo ID.
  async getCenterById(id) {
    try {
      const center = await this.centersRepository.findById(id);
      if (!center) {
        return null;
      }
      return center;
    } catch (error) {
      console.error("Lỗi ở service khi lấy trung tâm theo ID:", error);
      throw error;
    }
  }

  // Xử lý logic để tạo một trung tâm mới.
  async createCenter(centerData) {
    try {
      // Đảm bảo trạng thái `isVerified` có giá trị boolean hợp lệ trước khi tạo.
      const data = {
        ...centerData,
        isVerified: centerData.isVerified !== undefined ? centerData.isVerified : false,
      };
      const center = await this.centersRepository.create(data);
      return center;
    } catch (error) {
      console.error("Lỗi ở service khi tạo trung tâm:", error);
      throw error;
    }
  }

  // Cập nhật thông tin một trung tâm.
  async updateCenter(id, updateData) {
    try {
      const center = await this.centersRepository.update(id, updateData);
      if (!center) {
        return null;
      }
      return center;
    } catch (error) {
      console.error("Lỗi ở service khi cập nhật trung tâm:", error);
      throw error;
    }
  }

  // Xóa một trung tâm.
  async deleteCenter(id) {
    try {
      const deleted = await this.centersRepository.delete(id);
      return deleted;
    } catch (error) {
      console.error("Lỗi ở service khi xóa trung tâm:", error);
      throw error;
    }
  }

  // Thêm một bài đánh giá cho trung tâm.
  // Service có thể thêm các bước xác thực dữ liệu reviewData ở đây nếu cần.
  async addReview(centerId, reviewData) {
    try {
      const review = await this.centersRepository.addReview(centerId, reviewData);
      if (!review) {
        return null;
      }
      return review;
    } catch (error) {
      console.error("Lỗi ở service khi thêm đánh giá:", error);
      throw error;
    }
  }

  // Thay đổi trạng thái xác thực của một trung tâm (dành cho admin).
  async verifyCenter(id, isVerified = true) {
    try {
      const center = await this.centersRepository.verifyCenter(id, isVerified);
      if (!center) {
        return null;
      }
      return center;
    } catch (error) {
      console.error("Lỗi ở service khi duyệt trung tâm:", error);
      throw error;
    }
  }

  // Lấy tất cả các bài đánh giá trên hệ thống (dành cho admin).
  async getAllReviews(filters = {}, options = {}) {
    try {
      const reviews = await this.centersRepository.findAllReviews(filters, options);
      return reviews;
    } catch (error) {
      console.error("Lỗi ở service khi lấy tất cả đánh giá:", error);
      throw error;
    }
  }

  // Xóa một bài đánh giá khỏi trung tâm (dành cho admin).
  async deleteReview(centerId, reviewId) {
    try {
      const result = await this.centersRepository.deleteReview(centerId, reviewId);
      return result;
    } catch (error) {
      console.error("Lỗi ở service khi xóa đánh giá:", error);
      throw error;
    }
  }
}
