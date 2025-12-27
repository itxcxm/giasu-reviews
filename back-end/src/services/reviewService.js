import { ReviewRepository } from '../repositories/reviewRepository.js';

// Khởi tạo một instance của ReviewRepository để sử dụng trong service.
const reviewRepository = new ReviewRepository();

// Lớp ReviewService chứa business logic cho các hoạt động liên quan đến đánh giá.
// Hiện tại, lớp này chủ yếu đóng vai trò trung gian, gọi các phương thức từ repository.
// Trong tương lai, có thể thêm các logic phức tạp hơn ở đây (ví dụ: gửi email thông báo khi có review mới).
export class ReviewService {
  // Lấy tất cả các bài đánh giá, chuyển tiếp yêu cầu đến repository.
  async getAllReviews(options) {
    return await reviewRepository.findAll(options);
  }

  // Lấy các bài đánh giá của một người dùng cụ thể.
  async getReviewsByUserId(userId) {
    return await reviewRepository.findByUserId(userId);
  }

  // Xóa một bài đánh giá.
  async deleteReview(reviewId) {
    return await reviewRepository.delete(reviewId);
  }

  // Lấy các bài đánh giá của một trung tâm cụ thể.
  async getReviewsByCenterId(centerId) {
    return await reviewRepository.findByCenterId(centerId);
  }
}
