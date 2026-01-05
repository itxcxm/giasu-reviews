import Center from "../models/Centers.js";
import Review from "../models/Review.js";
import mongoose from "mongoose";

// Lớp Repository chịu trách nhiệm cho mọi tương tác với cơ sở dữ liệu liên quan đến 'Center' và 'Review'.
// Tách biệt logic truy vấn khỏi business logic trong services.
export class CentersRepository {
  // Tìm kiếm và lấy danh sách các trung tâm với các tùy chọn lọc, sắp xếp và phân trang.
  async findAll(filters = {}, options = {}) {
    try {
      const {
        search = "",
        isVerified = null,
        sortBy = "createdAt",
        sortOrder = "desc",
        page = 1,
        limit = 100, // Giới hạn mặc định khá lớn
      } = options;

      // Xây dựng đối tượng truy vấn MongoDB.
      const query = {};

      // Lọc theo trạng thái đã được duyệt (verified).
      if (isVerified !== null) {
        query.isVerified = isVerified === true || isVerified === "true";
      }

      // Thêm điều kiện tìm kiếm văn bản (text search) trên trường 'name' và 'address'.
      // `$options: "i"` để tìm kiếm không phân biệt chữ hoa/thường.
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { address: { $regex: search, $options: "i" } },
        ];
      }

      // Xây dựng đối tượng sắp xếp.
      const sort = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Tính toán số document cần bỏ qua để phân trang.
      const skip = (page - 1) * limit;

      const aggregation = [
        { $match: query },
        {
          $lookup: {
            from: "reviews",
            let: { centerId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$center", "$$centerId"] },
                      { $eq: ["$status", "approved"] },
                    ],
                  },
                },
              },
            ],
            as: "approvedReviews",
          },
        },
        {
          $addFields: {
            totalReviews: { $size: "$approvedReviews" },
            rating: {
              $ifNull: [{ $round: [{ $avg: "$approvedReviews.rating" }, 1] }, 0],
            },
          },
        },
        {
          $project: {
            approvedReviews: 0,
          },
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: parseInt(limit) },
      ];

      const centers = await Center.aggregate(aggregation);
      
      // Đếm tổng số document khớp với query để tính toán thông tin phân trang.
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
      console.error("Lỗi khi tìm kiếm tất cả trung tâm:", error);
      throw error;
    }
  }

  // Tìm một trung tâm duy nhất bằng ID.
  async findById(id) {
    try {
      const aggregation = [
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        {
          $lookup: {
            from: "reviews",
            let: { centerId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$center", "$$centerId"] },
                      { $eq: ["$status", "approved"] },
                    ],
                  },
                },
              },
            ],
            as: "approvedReviews",
          },
        },
        {
          $project: {
            name: 1,
            address: 1,
            phone: 1,
            website: 1,
            image: 1,
            isVerified: 1,
            createdAt: 1,
            updatedAt: 1,
            totalReviews: { $size: "$approvedReviews" },
            rating: {
              $ifNull: [{ $round: [{ $avg: "$approvedReviews.rating" }, 1] }, 0],
            },
          },
        },
      ];

      const results = await Center.aggregate(aggregation);
      
      if (results.length === 0) {
        return null;
      }
      
      return results[0];
    } catch (error) {
      console.error("Lỗi khi tìm trung tâm theo ID:", error);
      throw error;
    }
  }

  // Tạo một trung tâm mới trong cơ sở dữ liệu.
  async create(centerData) {
    try {
      const center = new Center(centerData);
      await center.save();
      return center.toObject(); // Chuyển Mongoose document thành plain object.
    } catch (error)
    {
      console.error("Lỗi khi tạo trung tâm:", error);
      throw error;
    }
  }

  // Cập nhật thông tin của một trung tâm đã có bằng ID.
  async update(id, updateData) {
    try {
      // Sử dụng `findByIdAndUpdate` để tìm và cập nhật trong một thao tác.
      // `$set` đảm bảo chỉ các trường trong `updateData` được cập nhật.
      // `new: true` để kết quả trả về là document sau khi đã cập nhật.
      // `runValidators: true` để kích hoạt các quy tắc xác thực (validation) của schema khi cập nhật.
      const center = await Center.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();
      return center;
    } catch (error) {
      console.error("Lỗi khi cập nhật trung tâm:", error);
      throw error;
    }
  }

  // Xóa một trung tâm khỏi cơ sở dữ liệu bằng ID.
  async delete(id) {
    try {
      const result = await Center.findByIdAndDelete(id);
      return result !== null; // Trả về true nếu có document bị xóa, ngược lại là false.
    } catch (error) {
      console.error("Lỗi khi xóa trung tâm:", error);
      throw error;
    }
  }

  // Thêm một bài đánh giá mới.
  // Bài đánh giá được lưu vào collection 'reviews' và sau đó cập nhật lại thông tin thống kê của trung tâm.
  async addReview(centerId, reviewData) {
    try {
      const center = await Center.findById(centerId);
      if (!center) {
        throw new Error("Không tìm thấy trung tâm.");
      }

      // Tạo một document Review mới.
      const newReview = new Review({
        ...reviewData,
        center: centerId,
        centerName: center.name, // Lưu lại tên trung tâm để hiển thị nhanh.
      });

      await newReview.save();
          
      return newReview.toObject();
    } catch (error) {
      console.error("Lỗi khi thêm đánh giá:", error);
      throw error;
    }
  }

  async updateCenterStatistics(centerId) {
    try {
      const stats = await Review.aggregate([
        { $match: { center: new mongoose.Types.ObjectId(centerId), status: 'approved' } },
        {
          $group: {
            _id: "$center",
            totalReviews: { $sum: 1 },
            averageRating: { $avg: "$rating" },
          },
        },
      ]);
      
      if (stats.length > 0) {
        await Center.findByIdAndUpdate(centerId, {
          reviewCount: stats[0].totalReviews,
          rating: parseFloat(stats[0].averageRating.toFixed(1)),
        });
      } else {
         await Center.findByIdAndUpdate(centerId, {
          reviewCount: 0,
          rating: 0,
        });
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật thống kê trung tâm:", error);
      // Không re-throw lỗi ở đây để không làm gián đoạn luồng chính
    }
  }

  // Cập nhật trạng thái xác thực của một trung tâm.
  async verifyCenter(id, isVerified = true) {
    try {
      const center = await Center.findByIdAndUpdate(
        id,
        { $set: { isVerified } },
        { new: true, runValidators: true }
      ).lean();
      return center;
    } catch (error) {
      console.error("Lỗi khi duyệt trung tâm:", error);
      throw error;
    }
  }

  // Tìm tất cả các bài đánh giá trên toàn hệ thống, có thể kèm tìm kiếm.
  async findAllReviews(filters = {}, options = {}) {
    try {
      const { search = "", sortBy = "createdAt", sortOrder = "desc" } = options;
  
      const query = {};
  
      if (search) {
        // Tìm các trung tâm có tên khớp với từ khóa tìm kiếm.
        const centers = await Center.find({ name: { $regex: search, $options: "i" } }).select('_id');
        const centerIds = centers.map(c => c._id);
  
        // Xây dựng truy vấn $or để tìm kiếm trên nhiều trường: theo centerId, hoặc nội dung comment.
        query.$or = [
          { center: { $in: centerIds } },
          { comment: { $regex: search, $options: "i" } },
        ];
      }
  
      const sort = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;
  
      // Lấy danh sách review, đồng thời populate thông tin của center và user liên quan.
      const allReviews = await Review.find(query)
        .populate({ path: 'center', select: 'name' }) // Lấy tên của trung tâm.
        .populate({ path: 'user', select: 'name' }) // Lấy tên của người dùng.
        .sort(sort)
        .lean();
  
      return allReviews;
    } catch (error) {
      console.error("Lỗi khi tìm tất cả đánh giá:", error);
      throw error;
    }
  }

  // Xóa một bài đánh giá và cập nhật lại thống kê cho trung tâm.
  async deleteReview(centerId, reviewId) {
    try {
      await Review.findByIdAndDelete(reviewId);
      await this.updateCenterStatistics(centerId);
      return true;
    } catch (error) {
      console.error("Lỗi khi xóa đánh giá:", error);
      throw error;
    }
  }
}
