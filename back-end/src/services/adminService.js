import User from "../models/User.js";
import bcrypt from "bcryptjs";

// Lớp AdminService chứa business logic dành riêng cho các hoạt động của admin.
export class AdminService {
  // Phương thức đăng ký một tài khoản admin mới.
  // Thường được sử dụng nội bộ hoặc qua một route được bảo vệ đặc biệt.
  async registerAdmin(name, email, password) {
    try {
      // Kiểm tra xem email đã tồn tại trong hệ thống chưa.
      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
      });

      if (existingUser) {
        throw new Error("Email đã được sử dụng");
      }

      // Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu.
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Tạo một đối tượng người dùng mới với vai trò là 'admin'.
      const newUser = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'admin', // Gán vai trò admin một cách tường minh.
        isActive: true, // Tài khoản admin mặc định được kích hoạt.
      });

      const savedUser = await newUser.save();

      // Chuyển kết quả sang plain object và xóa mật khẩu trước khi trả về.
      const userObj = savedUser.toObject();
      delete userObj.password;
      return userObj;
    } catch (error) {
      console.error("Lỗi khi đăng ký admin:", error);
      throw error;
    }
  }

  // Xử lý logic đăng nhập cho admin.
  async loginAdmin(email, password) {
    try {
      // Tìm người dùng theo email.
      const user = await User.findOne({ email });

      // Nếu không tìm thấy người dùng hoặc người dùng không có vai trò 'admin'.
      if (!user || user.role !== 'admin') {
        return null;
      }

      // So sánh mật khẩu được cung cấp với mật khẩu đã mã hóa trong DB.
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return null;
      }

      // Đăng nhập thành công, xóa mật khẩu và trả về thông tin người dùng.
      const userObj = user.toObject();
      delete userObj.password;
      return userObj;
    } catch (error) {
      console.error("Lỗi khi đăng nhập admin:", error);
      throw error;
    }
  }

  // Cập nhật thông tin cá nhân của admin.
  async updateAdmin(adminId, updateData) {
    try {
      const { name, email, oldPassword, newPassword } = updateData;

      const admin = await User.findById(adminId);
      if (!admin || admin.role !== 'admin') {
        throw new Error("Admin không tồn tại");
      }

      // Nếu có thay đổi email, kiểm tra xem email mới đã được ai sử dụng chưa.
      if (email && email.toLowerCase().trim() !== admin.email) {
        const existingUser = await User.findOne({
          email: email.toLowerCase().trim(),
        });
        if (existingUser) {
          throw new Error("Email đã được sử dụng");
        }
      }

      // Nếu có thay đổi mật khẩu.
      if (newPassword) {
        if (!oldPassword) {
          throw new Error("Cần cung cấp mật khẩu cũ để thay đổi mật khẩu");
        }
        // Xác thực mật khẩu cũ.
        const isOldPasswordValid = await bcrypt.compare(oldPassword, admin.password);
        if (!isOldPasswordValid) {
          throw new Error("Mật khẩu cũ không chính xác");
        }
        // Mã hóa và cập nhật mật khẩu mới.
        const saltRounds = 10;
        admin.password = await bcrypt.hash(newPassword, saltRounds);
      }

      // Cập nhật các trường thông tin khác nếu có.
      if (name) {
        admin.name = name.trim();
      }
      if (email) {
        admin.email = email.toLowerCase().trim();
      }

      const updatedAdmin = await admin.save();

      const adminObj = updatedAdmin.toObject();
      delete adminObj.password;
      return adminObj;
    } catch (error) {
      console.error("Lỗi khi cập nhật admin:", error);
      throw error;
    }
  }
};

