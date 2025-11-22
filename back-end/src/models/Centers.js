import mongoose from "mongoose";

// Schema cho đánh giá (reviews/comment)
const reviewSchema = new mongoose.Schema(
  {
    image: {
      type: String, // URL hoặc path đến hình ảnh trong comment (giữ lại để backward compatibility)
      trim: true,
    },
    images: {
      type: [String], // Mảng các URL hình ảnh trong comment
      default: [],
    },
    comment: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, "Mức đánh giá phải từ 1 đến 5"],
      max: [5, "Mức đánh giá phải từ 1 đến 5"],
    },
    reviewerName: {
      type: String,
      trim: true,
      maxlength: [100, "Tên người đánh giá không được vượt quá 100 ký tự"],
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt (thời gian)
  }
);

// Schema chính cho trung tâm gia sư
const centerSchema = new mongoose.Schema(
  {
    // Tên trung tâm
    name: {
      type: String,
      required: [true, "Tên trung tâm là bắt buộc"],
      trim: true,
      maxlength: [200, "Tên trung tâm không được vượt quá 200 ký tự"],
    },
    // Địa chỉ
    address: {
      type: String,
      trim: true,
      maxlength: [500, "Địa chỉ không được vượt quá 500 ký tự"],
    },
    // Điện thoại
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9\s\-+()]+$/, "Số điện thoại không hợp lệ"],
    },
    // Website trung tâm (nếu có)
    website: {
      type: String,
      trim: true,
      match: [
        /^https?:\/\/.+/,
        "Website phải bắt đầu với http:// hoặc https://",
      ],
    },
    // Hình ảnh (URL từ upanhnhanh.com)
    image: {
      type: String, // URL của hình ảnh (từ upanhnhanh.com)
      trim: true,
      validate: {
        validator: function (v) {
          // Nếu có giá trị, phải là URL hợp lệ (http:// hoặc https://)
          if (!v) return true; // Cho phép empty
          return /^https?:\/\/.+/.test(v);
        },
        message: "Image phải là URL hợp lệ (bắt đầu với http:// hoặc https://)",
      },
    },
    // Trạng thái duyệt (false = chưa duyệt, true = đã duyệt)
    isVerified: {
      type: Boolean,
      default: false, // Mặc định là chưa duyệt
    },
    // Danh sách đánh giá (comment)
    reviews: {
      type: [reviewSchema],
      default: [],
    },
    // Số lượt đánh giá
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, "Số lượng đánh giá không được âm"],
    },
    // Tổng đánh giá (trung bình)
    rating: {
      type: Number,
      default: 0,
      min: [0, "Đánh giá không được nhỏ hơn 0"],
      max: [5, "Đánh giá không được lớn hơn 5"],
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt (thời gian)
  }
);

// Index để tìm kiếm nhanh hơn
centerSchema.index({ name: "text", address: "text" }); // Text search
centerSchema.index({ rating: -1 }); // Sắp xếp theo rating
centerSchema.index({ reviewCount: -1 }); // Sắp xếp theo số lượng đánh giá
centerSchema.index({ createdAt: -1 }); // Sắp xếp theo ngày tạo
centerSchema.index({ isVerified: 1 }); // Tìm kiếm theo trạng thái duyệt

// Method để tính lại rating trung bình
centerSchema.methods.calculateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.reviewCount = 0;
    return;
  }

  const totalRating = this.reviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );
  this.rating = parseFloat((totalRating / this.reviews.length).toFixed(1));
  this.reviewCount = this.reviews.length;
};

// Pre-save hook để tự động tính lại rating khi reviews thay đổi
centerSchema.pre("save", function (next) {
  if (this.isModified("reviews")) {
    this.calculateRating();
  }
  next();
});

// Export model
const Center = mongoose.model("Center", centerSchema);

export default Center;
