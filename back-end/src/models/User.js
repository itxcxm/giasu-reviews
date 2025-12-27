import mongoose from "mongoose";

// Định nghĩa cấu trúc (schema) cho một người dùng (User).
const userSchema = new mongoose.Schema(
  {
    // Tên của người dùng.
    name: {
      type: String,
      required: true, // Bắt buộc phải có.
    },
    // Địa chỉ email của người dùng, dùng để đăng nhập.
    email: {
      type: String,
      required: true,
      unique: true, // Đảm bảo mỗi email là duy nhất trong collection, không thể có hai người dùng cùng email.
      lowercase: true, // Tự động chuyển đổi email về dạng chữ thường trước khi lưu để tránh trùng lặp (ví dụ: 'Email@test.com' và 'email@test.com' được coi là một).
      trim: true, // Tự động loại bỏ khoảng trắng ở đầu và cuối.
    },
    // Mật khẩu đã được mã hóa (hashed) của người dùng.
    password: {
      type: String,
      required: true,
    },
    // Vai trò của người dùng trong hệ thống.
    role: {
      type: String,
      required: true,
      enum: ["user", "admin"], // Chỉ cho phép một trong hai giá trị này.
      default: "user", // Giá trị mặc định khi tạo người dùng mới là 'user'.
    },
    // Trạng thái tài khoản của người dùng.
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive", "banned"], // Chỉ cho phép một trong ba giá trị này.
      default: "active", // Mặc định là 'active'.
    },
    // Danh sách các quyền (permissions) của người dùng.
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission", // Tham chiếu đến model 'Permission'.
      },
    ],
  },
  {
    // Tự động thêm hai trường `createdAt` và `updatedAt` vào mỗi document.
    timestamps: true,
  }
);

// --- INDEXES ---
// Chỉ mục (index) giúp tăng tốc độ truy vấn.
userSchema.index({ createdAt: -1 }); // Tối ưu cho việc sắp xếp người dùng theo ngày tạo mới nhất.

// Tạo và export model 'User' từ schema đã định nghĩa.
const User = mongoose.model("User", userSchema);

export default User;
