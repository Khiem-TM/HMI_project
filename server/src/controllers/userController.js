import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

// Đăng ký
export const registerUser = async (req, res) => {
  try {
    // check validation error
    const errors = validationResult(req); // 1 hàm trong thư viện Validate của expressjs --> lấy ra error list
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Lỗi validate user",
        errors: errors.array(),
      });
    }
    const { name, email, password } = req.body;

    // Xác thực tính hợp lệ của dữ liệu gửi đi
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        message: "Email existed",
      });
    }

    // Băm
    const hashedPassword = await bcrypt.hash(password, 12);
    // bcrypt là 1 thư viện cung cấp cho việc hash mật khẩu --> Đây là hash 1 chiều:
    // Tức là khi đăng ký thì mật khẩu sẽ được hash và lưu vào db --> Khi người dùng đăng nhập (thì mật khẩu sẽ được hash 1 lần nữa) --> đem đi so sánh với mật khẩu đã được hash lúc đăng ký

    // create new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // return user res
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };

    res.status(201).json({
      message: "Đăng ký thành công",
      user: userResponse,
    });
  } catch (error) {
    console.log("registration error;", error);
    res.status(500).json({ message: "Lỗi server khi đăng ký" });
  }
};

// Luồng:
// Nhận req (name, email, pass) đặt trong req.body --> Check validate --> check email existed --> Băm pass --> create user trong mongoDB --> create res --> log ra cho client

// Đăng nhập:
export const loginUser = async (req, res) => {
  try {
    // check validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu sai, nhập lại đi con gà!" });
    }

    // so sánh pass --> hash & compare
    const isMatch = await bcrypt.compare(password, user.password); // Thư viện bcrypt cung cấp tác vụ so sánh
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu sai, nhập lại đi con gà!" });
    }

    //Nếu đúng --> Tạo JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
  } catch (error) {
    console.log("registration error;", error);
    res.status(500).json({ message: "Lỗi server khi đăng nhap" });
  }
};

// Lấy thông tin user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found :V",
      });
    }
    res.json(user);
  } catch (error) {
    console.log("Get user error:", error);
    res.status(500).json({ message: "Lỗi server khi lấy thông tin user" });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    // check email (nếu thay đổi email) --> Để tránh trùng với tk khác
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: userId },
      });
      // Nhảy lỗi nếu đã có email
      if (existingUser) {
        return res.status(400).json({
          message: "Email đã được sử dụng",
        });
      }
    }

    // update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name,
        email,
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "user not found!",
      });
    }

    res.json({
      message: "update profile thành công",
      user: updatedUser, // ghi đè
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật profile" });
  }
};

// Đổi mật khẩu -
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // check input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Không đủ thông tin, vui lòng nhập lại",
      });
    }

    // Kiểm tra bảo mật mức nhẹ  --> demo ( có gì ae thêm vào sau )
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu yếu, vui lòng nhập lại !",
      });
    }

    // Lấy user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Mật khẩu hiện tại không khớp",
      });
    }

    // hash newPassword
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // update
    user.password = hashedPassword;
    await user.save();
  } catch (error) {
    console.error("Lổi đổi mật khẩu", error);
    res.status(500).json({
      message: "Lỗi server khi đổi mật khẩu",
    });
  }
};
