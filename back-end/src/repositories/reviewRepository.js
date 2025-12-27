import Review from '../models/Review.js';
import Center from '../models/Centers.js';
import User from '../models/User.js';

// Lớp Repository chịu trách nhiệm cho các tương tác với cơ sở dữ liệu liên quan đến 'Review'.
export class ReviewRepository {
  // Tìm và lấy tất cả các bài đánh giá, hỗ trợ tìm kiếm và sắp xếp.
  async findAll(options = {}) {
    try {
      const { search = "", sortBy = "createdAt", sortOrder = "desc" } = options;
  
      const query = {};
  
      // Nếu có từ khóa tìm kiếm, xây dựng một truy vấn phức hợp.
      if (search) {
        // Tìm các trung tâm có tên khớp với từ khóa.
        const centers = await Center.find({ name: { $regex: search, $options: "i" } }).select('_id');
        const centerIds = centers.map(c => c._id);
  
        // Tìm những người dùng có tên khớp với từ khóa.
        const users = await User.find({ name: { $regex: search, $options: "i" } }).select('_id');
        const userIds = users.map(u => u._id);
  
        // Tìm các review khớp với một trong các điều kiện:
        // - Thuộc về một trong các trung tâm đã tìm thấy.
        // - Được viết bởi một trong những người dùng đã tìm thấy.
        // - Có nội dung bình luận chứa từ khóa.
        query.$or = [
          { center: { $in: centerIds } },
          { user: { $in: userIds } },
          { comment: { $regex: search, $options: "i" } },
        ];
      }
  
      // Cấu hình sắp xếp.
      const sort = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;
  
      // Thực thi truy vấn, đồng thời "populate" để lấy thông tin chi tiết từ các model liên quan.
      const allReviews = await Review.find(query)
        .populate({ path: 'center', select: 'name' }) // Lấy tên của trung tâm.
        .populate({ path: 'user', select: 'name' })   // Lấy tên của người dùng.
        .sort(sort)
        .lean(); // Tăng hiệu suất bằng cách trả về plain JS objects.
  
      return allReviews;
    } catch (error) {
      console.error("Lỗi khi tìm tất cả đánh giá:", error);
      throw error;
    }
  }

  // Tìm tất cả các bài đánh giá được viết bởi một người dùng cụ thể.
  async findByUserId(userId) {
    try {
      const reviews = await Review.find({ user: userId })
        .populate({ path: 'center', select: 'name' }) // Lấy tên của trung tâm liên quan.
        .sort({ createdAt: -1 }) // Sắp xếp theo ngày tạo mới nhất.
        .lean();
      return reviews;
    } catch (error) {
      console.error("Lỗi khi tìm đánh giá theo ID người dùng:", error);
      throw error;
    }
  }

  // Xóa một bài đánh giá và cập nhật lại thống kê của trung tâm liên quan.
  async delete(reviewId) {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error("Không tìm thấy bài đánh giá.");
      }
      const centerId = review.center;

      // Xóa bài đánh giá.
      await Review.findByIdAndDelete(reviewId);

      // Tính toán lại điểm trung bình và số lượng đánh giá cho trung tâm.
      const stats = await Review.aggregate([
        { $match: { center: centerId, status: 'approved' } }, // Chỉ tính các review đã được duyệt.
        {
          $group: {
            _id: '$center',
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' },
          },
        },
      ]);

      // Cập nhật lại trung tâm với các chỉ số mới.
      if (stats.length > 0) {
        await Center.findByIdAndUpdate(centerId, {
          reviewCount: stats[0].totalReviews,
          rating: parseFloat(stats[0].averageRating.toFixed(1)),
        });
      } else {
        // Nếu không còn review nào, reset các chỉ số về 0.
        await Center.findByIdAndUpdate(centerId, {
          reviewCount: 0,
          rating: 0,
        });
      }
    } catch (error) {
      console.error("Lỗi khi xóa đánh giá:", error);
      throw error;
    }
  }

  // Tìm tất cả các bài đánh giá của một trung tâm cụ thể.
  async findByCenterId(centerId) {
    try {
      const reviews = await Review.find({ center: centerId })
        .populate({ path: 'user', select: 'name' }) // Lấy tên của người viết đánh giá.
        .sort({ createdAt: -1 })
        .lean();
      return reviews;
    } catch (error) {
      console.error("Lỗi khi tìm đánh giá theo ID trung tâm:", error);
      throw error;
    }
  }
}
