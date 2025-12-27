import mongoose from "mongoose";

// Định nghĩa cấu trúc (schema) cho một bài đánh giá (review) được lồng trong schema của trung tâm.
const reviewSchema = new mongoose.Schema(
  {
    // URL ảnh của bài đánh giá. Giữ lại để tương thích với phiên bản cũ.
    image: {
      type: String,
      trim: true,
    },
    // Mảng các URL ảnh của bài đánh giá, hỗ trợ upload nhiều ảnh.
    images: {
      type: [String],
      default: [],
    },
    // Nội dung bình luận.
    comment: {
      type: String,
      trim: true,
    },
    // Điểm đánh giá (từ 1 đến 5 sao).
    rating: {
      type: Number,
      required: true,
      min: [1, "Mức đánh giá phải từ 1 đến 5."],
      max: [5, "Mức đánh giá phải từ 1 đến 5."],
    },
    // Tên người đánh giá (có thể không cần nếu liên kết với model User).
    reviewerName: {
      type: String,
      trim: true,
      maxlength: [100, "Tên người đánh giá không được vượt quá 100 ký tự."],
    },
  },
  {
    timestamps: true, // Tự động thêm hai trường `createdAt` và `updatedAt`.
  }
);

// Định nghĩa cấu trúc (schema) chính cho một trung tâm gia sư.
const centerSchema = new mongoose.Schema(
  {
    // Tên của trung tâm.
    name: {
      type: String,
      required: [true, "Tên trung tâm là bắt buộc."],
      trim: true,
      maxlength: [200, "Tên trung tâm không được vượt quá 200 ký tự."],
    },
    // Địa chỉ của trung tâm.
    address: {
      type: String,
      trim: true,
      maxlength: [500, "Địa chỉ không được vượt quá 500 ký tự."],
    },
    // Số điện thoại liên hệ.
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9\s\-+()]+$/, "Số điện thoại không hợp lệ."],
    },
    // Trang web của trung tâm.
    website: {
      type: String,
      trim: true,
      // Bắt buộc phải là một URL hợp lệ.
      match: [
        /^https?:\/\/.+/,
        "Website phải bắt đầu với http:// hoặc https://",
      ],
    },
    // URL hình ảnh đại diện của trung tâm.
    image: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          // Cho phép trường này rỗng, nhưng nếu có giá trị thì phải là URL.
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: "URL hình ảnh phải là một URL hợp lệ.",
      },
    },
    // Trạng thái xác thực (đã được duyệt hay chưa).
    isVerified: {
      type: Boolean,
      default: false, // Mặc định khi tạo mới là chưa được duyệt.
    },
    // Mảng chứa các bài đánh giá, sử dụng schema đã định nghĩa ở trên.
    reviews: {
      type: [reviewSchema],
      default: [],
    },
    // Tổng số lượng bài đánh giá.
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, "Số lượng đánh giá không được là số âm."],
    },
    // Điểm đánh giá trung bình của trung tâm.
    rating: {
      type: Number,
      default: 0,
      min: [0, "Điểm đánh giá không được nhỏ hơn 0."],
      max: [5, "Điểm đánh giá không được lớn hơn 5."],
    },
  },
  {
    timestamps: true, // Tự động thêm `createdAt` và `updatedAt`.
  }
);

// --- INDEXES ---
// Các chỉ mục (index) giúp tăng tốc độ truy vấn dữ liệu trong MongoDB.
centerSchema.index({ name: "text", address: "text" }); // Hỗ trợ tìm kiếm toàn văn (full-text search) trên trường 'name' và 'address'.
centerSchema.index({ rating: -1 }); // Tối ưu cho việc sắp xếp các trung tâm theo điểm đánh giá giảm dần.
centerSchema.index({ reviewCount: -1 }); // Tối ưu cho việc sắp xếp theo số lượng đánh giá giảm dần.
centerSchema.index({ createdAt: -1 }); // Tối ưu cho việc sắp xếp theo ngày tạo mới nhất.
centerSchema.index({ isVerified: 1 }); // Tối ưu cho việc lọc các trung tâm đã được duyệt hoặc chưa.

// --- METHODS ---
// Định nghĩa một phương thức cho các đối tượng (document) của schema.
// Phương thức này tính toán lại điểm rating trung bình và số lượng review.
centerSchema.methods.calculateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.reviewCount = 0;
    return;
  }

  // Tính tổng điểm từ tất cả các review.
  const totalRating = this.reviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );
  // Tính điểm trung bình và làm tròn đến một chữ số thập phân.
  this.rating = parseFloat((totalRating / this.reviews.length).toFixed(1));
  this.reviewCount = this.reviews.length;
};

// --- HOOKS ---
// `pre('save')` là một hook (middleware) của Mongoose, sẽ được thực thi trước khi một document được lưu vào DB.
// Ở đây, nó dùng để tự động gọi `calculateRating` mỗi khi có sự thay đổi trong mảng `reviews`.
centerSchema.pre("save", function (next) {
  if (this.isModified("reviews")) {
    this.calculateRating();
  }
  next(); // Phải gọi next() để tiếp tục quá trình lưu.
});

// Tạo và export model 'Center' từ schema đã định nghĩa.
const Center = mongoose.model("Center", centerSchema);

export default Center;
