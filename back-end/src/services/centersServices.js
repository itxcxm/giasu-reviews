import { CentersRepository } from "../repositories/centersRepositories.js";

// Service quản lý business logic cho Centers
export class CentersService {
  constructor() {
    this.centersRepository = new CentersRepository();
  }

  // Lấy danh sách centers
  async getCenters(filters = {}, options = {}) {
    try {
      const result = await this.centersRepository.findAll(filters, options);
      return result;
    } catch (error) {
      console.error("Get centers service error:", error);
      throw error;
    }
  }

  // Lấy tất cả centers (dành cho admin/moderator)
  async getAllCenters(filters = {}, options = {}) {
    try {
      const result = await this.centersRepository.findAll(filters, options);
      return result;
    } catch (error) {
      console.error("Get centers service error:", error);
      throw error;
    }
  }

  // Lấy center theo ID
  async getCenterById(id) {
    try {
      const center = await this.centersRepository.findById(id);

      if (!center) {
        return null;
      }

      return center;
    } catch (error) {
      console.error("Get center by id service error:", error);
      throw error;
    }
  }

  // Tạo center mới
  async createCenter(centerData) {
    try {
      // Đảm bảo isVerified mặc định là false
      const data = {
        ...centerData,
        isVerified: false,
      };

      const center = await this.centersRepository.create(data);
      return center;
    } catch (error) {
      console.error("Create center service error:", error);
      throw error;
    }
  }

  // Cập nhật center
  async updateCenter(id, updateData) {
    try {
      const center = await this.centersRepository.update(id, updateData);

      if (!center) {
        return null;
      }

      return center;
    } catch (error) {
      console.error("Update center service error:", error);
      throw error;
    }
  }

  // Xóa center
  async deleteCenter(id) {
    try {
      const deleted = await this.centersRepository.delete(id);
      return deleted;
    } catch (error) {
      console.error("Delete center service error:", error);
      throw error;
    }
  }

  // Thêm review cho center
  async addReview(centerId, reviewData) {
    try {
      // Validate review data

      const center = await this.centersRepository.addReview(
        centerId,
        reviewData
      );

      if (!center) {
        return null;
      }

      return center;
    } catch (error) {
      console.error("Add review service error:", error);
      throw error;
    }
  }

  // Duyệt center (admin)
  async verifyCenter(id, isVerified = true) {
    try {
      const center = await this.centersRepository.verifyCenter(id, isVerified);

      if (!center) {
        return null;
      }

      return center;
    } catch (error) {
      console.error("Verify center service error:", error);
      throw error;
    }
  }

  // Lấy tất cả reviews từ tất cả centers (cho admin)
  async getAllReviews(filters = {}, options = {}) {
    try {
      const reviews = await this.centersRepository.findAllReviews(
        filters,
        options
      );
      return reviews;
    } catch (error) {
      console.error("Get all reviews service error:", error);
      throw error;
    }
  }

  // Xóa review từ center (admin)
  async deleteReview(centerId, reviewId) {
    try {
      const center = await this.centersRepository.deleteReview(
        centerId,
        reviewId
      );

      if (!center) {
        return null;
      }

      return center;
    } catch (error) {
      console.error("Delete review service error:", error);
      throw error;
    }
  }
}
