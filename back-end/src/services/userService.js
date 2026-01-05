import bcrypt from "bcryptjs";
import { UserRepository } from "../repositories/userRepository.js";

export class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async registerUser(name, email, password) {
    try {
      const existingUser = await this.userRepository.findUserByEmail(
        email.toLowerCase().trim()
      );

      if (existingUser) {
        throw new Error("Email đã được sử dụng");
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        status: "active",
        role: "user",
      };

      const savedUser = await this.userRepository.createUser(newUser);

      const userObj = savedUser.toObject();
      delete userObj.password;
      return userObj;
    } catch (error) {
      console.error("Lỗi khi đăng ký người dùng:", error);
      throw error;
    }
  }

  async loginUser(email, password) {
    try {
      const user = await this.userRepository.findUserByEmail(email);

      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return null;
      }
      
      if (user.status !== "active") {
        throw new Error("Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt.");
      }

      const userObj = user.toObject();
      delete userObj.password;
      return userObj;
    } catch (error) {
      console.error("Lỗi khi đăng nhập người dùng:", error);
      throw error;
    }
  }

  async getUsers(options) {
    return this.userRepository.findAllUsers(options);
  }

  async deleteUser(userId) {
    return this.userRepository.deleteUserById(userId);
  }

  async updateUser(userId, updateData) {
    return this.userRepository.updateUserById(userId, updateData);
  }

  async updateUserStatus(userId, status) {
    return this.userRepository.updateUserById(userId, { status });
  }

  async updateUserPermissions(userId, permissionIds) {
    return this.userRepository.updateUserById(userId, { permissions: permissionIds });
  }
}

