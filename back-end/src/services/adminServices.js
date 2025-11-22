import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";

// Service quản lý các thao tác với Admin
export class AdminService {
  // Đăng ký admin mới
  async registerAdmin(name, email, password) {
    try {
      // Kiểm tra email đã tồn tại chưa
      const existingAdmin = await Admin.findOne({
        email: email.toLowerCase().trim(),
      });

      if (existingAdmin) {
        throw new Error("Email đã được sử dụng");
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Tạo admin mới (mặc định isActive = false)
      const newAdmin = new Admin({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: "admin",
        isActive: false, // Tài khoản mới đăng ký chưa active
      });

      // Lưu vào database
      const savedAdmin = await newAdmin.save();

      // Trả về admin (không bao gồm password)
      const adminObj = savedAdmin.toObject();
      delete adminObj.password;
      return adminObj;
    } catch (error) {
      console.error("Register admin error:", error);
      throw error;
    }
  }

  // Đăng nhập admin
  async loginAdmin(email, password) {
    try {
      // Tìm admin theo email
      const admin = await Admin.findOne({ email });

      // Không tìm thấy admin
      if (!admin) {
        return null;
      }

      // Kiểm tra password
      const isPasswordValid = await bcrypt.compare(password, admin.password);

      if (!isPasswordValid) {
        return null;
      }

      // Kiểm tra role phải là admin
      if (admin.role !== "admin") {
        return null;
      }

      // Kiểm tra tài khoản đã được active chưa
      if (!admin.isActive) {
        throw new Error(
          "Tài khoản chưa được kích hoạt. Vui lòng liên hệ quản trị viên."
        );
      }

      // Trả về admin (không bao gồm password)
      const adminObj = admin.toObject();
      delete adminObj.password;
      return adminObj;
    } catch (error) {
      console.error("Login admin error:", error);
      throw error;
    }
  }
}
