import mongoose from "mongoose";

// Định nghĩa cấu trúc (schema) cho một bài đánh giá (Review) dưới dạng một collection riêng biệt trong DB.
// Mô hình này cho phép quản lý các bài đánh giá một cách độc lập và hiệu quả hơn.
const reviewSchema = new mongoose.Schema(
  {
    // Tham chiếu đến trung tâm được đánh giá.
    center: {
      type: mongoose.Schema.Types.ObjectId, // Kiểu dữ liệu đặc biệt của MongoDB cho ID.
      ref: "Center", // Liên kết đến model 'Center'.
      required: true, // Bắt buộc phải có.
    },
    // Tham chiếu đến người dùng đã viết bài đánh giá.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Liên kết đến model 'User'.
      required: true,
    },
    // Tên của trung tâm tại thời điểm đánh giá.
    // Dùng để hiển thị nhanh mà không cần populate, hữu ích khi tên trung tâm có thể thay đổi trong tương lai.
    centerName: {
      type: String,
      required: true,
      trim: true,
    },
    // Điểm đánh giá (từ 1 đến 5 sao).
    rating: {
      type: Number,
      required: true,
      min: [1, "Mức đánh giá phải từ 1 đến 5."],
      max: [5, "Mức đánh giá phải từ 1 đến 5."],
    },
    // Nội dung bình luận chi tiết.
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Nội dung đánh giá không được vượt quá 1000 ký tự."],
    },
    // Mảng chứa các URL của hình ảnh đính kèm bài đánh giá.
    images: {
      type: [String],
      default: [],
    },
    // Trạng thái của bài đánh giá, dùng cho quy trình kiểm duyệt.
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"], // Chỉ chấp nhận một trong ba giá trị này.
      default: "approved", // Mặc định là 'đã duyệt' khi mới tạo.
    },
    // Cờ đánh dấu bài đánh giá đã từng được chỉnh sửa hay chưa.
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Tự động thêm hai trường `createdAt` và `updatedAt`.
  }
);

// --- INDEXES ---
// Các chỉ mục giúp tăng tốc độ truy vấn.
reviewSchema.index({ center: 1 }); // Tối ưu việc tìm kiếm tất cả review của một trung tâm.
reviewSchema.index({ user: 1 }); // Tối ưu việc tìm kiếm tất cả review của một người dùng.
reviewSchema.index({ status: 1 }); // Tối ưu việc lọc review theo trạng thái (pending, approved...).
reviewSchema.index({ createdAt: -1 }); // Tối ưu việc sắp xếp review theo thời gian mới nhất.

// Tạo và export model 'Review' từ schema đã định nghĩa.
const Review = mongoose.model("Review", reviewSchema);

export default Review;
