import Center from "../models/Centers.js";

// Repository quản lý các thao tác với database cho Centers
export class CentersRepository {
  // Lấy tất cả centers với filter và pagination
  async findAll(filters = {}, options = {}) {
    try {
      const {
        search = "",
        isVerified = null,
        sortBy = "createdAt",
        sortOrder = "desc",
        page = 1,
        limit = 100,
      } = options;

      // Xây dựng query
      const query = {};

      // Filter theo isVerified
      if (isVerified !== null) {
        query.isVerified = isVerified === true || isVerified === "true";
      }

      // Tìm kiếm theo tên hoặc địa chỉ
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { address: { $regex: search, $options: "i" } },
        ];
      }

      // Sắp xếp
      const sort = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Pagination
      const skip = (page - 1) * limit;

      // Thực hiện query
      const centers = await Center.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Đếm tổng số
      const total = await Center.countDocuments(query);

      return {
        centers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Find all centers error:", error);
      throw error;
    }
  }

  // Lấy center theo ID
  async findById(id) {
    try {
      const center = await Center.findById(id).lean();
      return center;
    } catch (error) {
      console.error("Find center by id error:", error);
      throw error;
    }
  }

  // Tạo center mới
  async create(centerData) {
    try {
      const center = new Center(centerData);
      await center.save();
      return center.toObject();
    } catch (error) {
      console.error("Create center error:", error);
      throw error;
    }
  }

  // Cập nhật center
  async update(id, updateData) {
    try {
      const center = await Center.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();

      return center;
    } catch (error) {
      console.error("Update center error:", error);
      throw error;
    }
  }

  // Xóa center
  async delete(id) {
    try {
      const result = await Center.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      console.error("Delete center error:", error);
      throw error;
    }
  }

  // Thêm review vào center
  async addReview(centerId, reviewData) {
    try {
      const center = await Center.findById(centerId);

      if (!center) {
        return null;
      }

      // Đảm bảo image field hợp lệ trước khi save (nếu có)
      // Nếu image không phải URL hợp lệ, set thành undefined
      if (center.image && typeof center.image === "string") {
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(center.image)) {
          // Image không hợp lệ, set thành undefined để pass validation
          center.image = undefined;
        }
      }

      // Thêm review vào mảng
      center.reviews.push(reviewData);

      // Lưu để trigger pre-save hook tính lại rating
      await center.save();

      return center.toObject();
    } catch (error) {
      console.error("Add review error:", error);
      throw error;
    }
  }

  // Duyệt center (admin)
  async verifyCenter(id, isVerified = true) {
    try {
      const center = await Center.findByIdAndUpdate(
        id,
        { $set: { isVerified } },
        { new: true, runValidators: true }
      ).lean();

      return center;
    } catch (error) {
      console.error("Verify center error:", error);
      throw error;
    }
  }

  // Lấy tất cả reviews từ tất cả centers (cho admin)
  async findAllReviews(filters = {}, options = {}) {
    try {
      const { search = "", sortBy = "createdAt", sortOrder = "desc" } = options;

      // Lấy tất cả centers có reviews
      const centers = await Center.find({}).select("name reviews").lean();

      // Flatten reviews và thêm thông tin center
      let allReviews = [];
      centers.forEach((center) => {
        if (center.reviews && center.reviews.length > 0) {
          center.reviews.forEach((review) => {
            allReviews.push({
              ...review,
              centerId: center._id,
              centerName: center.name,
            });
          });
        }
      });

      // Filter theo search
      if (search) {
        allReviews = allReviews.filter(
          (review) =>
            review.centerName.toLowerCase().includes(search.toLowerCase()) ||
            (review.comment &&
              review.comment.toLowerCase().includes(search.toLowerCase()))
        );
      }

      // Sort
      allReviews.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        // Xử lý Date objects
        if (sortBy === "createdAt" || sortBy === "updatedAt") {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        } else {
          aValue = aValue || 0;
          bValue = bValue || 0;
        }

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      return allReviews;
    } catch (error) {
      console.error("Find all reviews error:", error);
      throw error;
    }
  }

  // Xóa review từ center
  async deleteReview(centerId, reviewId) {
    try {
      const center = await Center.findById(centerId);

      if (!center) {
        return null;
      }

      // Xóa review khỏi mảng
      center.reviews = center.reviews.filter(
        (review) => review._id.toString() !== reviewId
      );

      // Lưu để trigger pre-save hook tính lại rating
      await center.save();

      return center.toObject();
    } catch (error) {
      console.error("Delete review error:", error);
      throw error;
    }
  }
}
