import User from '../models/User.js';

export class UserRepository {
  async findUserByEmail(email) {
    return await User.findOne({ email });
  }

  async findUserById(id) {
    return await User.findById(id).populate('permissions');
  }

  async createUser(userData) {
    const user = new User(userData);
    await user.save();
    return user;
  }

  async findAllUsers(options = {}) {
    const { search, status } = options;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    return await User.find(query).populate('permissions');
  }

  async deleteUserById(id) {
    return await User.findByIdAndDelete(id);
  }

  async updateUserById(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, { new: true });
  }
}

