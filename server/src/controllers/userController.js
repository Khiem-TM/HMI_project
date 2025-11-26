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

    // Update lastLoginAt (for new users, this is registration time)
    newUser.lastLoginAt = new Date();
    await newUser.save();

    // Create UserProfile for new user
    const UserProfile = (await import("../models/UserProfile.js")).default;
    try {
      await UserProfile.create({
        userId: newUser._id,
        totalScore: 0,
        totalGamesPlayed: 0,
        totalCorrectAnswers: 0,
        totalWrongAnswers: 0,
        accuracyRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        level: 1,
        rank: "bronze",
      });
    } catch (profileError) {
      console.warn("Failed to create user profile:", profileError);
    }

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
    console.error("Lỗi đăng ký:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

export const loginWithGoogle = async (req, res) => {
  try {
    const { name, email, googleId, avatar } = req.body;

    // Kiểm tra xem user đã tồn tại chưa
    let user = await User.findOne({ email });

    if (user) {
      // User đã tồn tại -> Đăng nhập
      // Nếu user cũ chưa có googleId (đăng ký bằng email thường), ta cập nhật thêm googleId để link tài khoản
      if (!user.googleId) {
        user.googleId = googleId;
        user.authType = "google";
        if (avatar && !user.avatar) user.avatar = avatar;
      }

      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // User chưa tồn tại -> Đăng ký mới (Không cần password)
      user = await User.create({
        name,
        email,
        googleId,
        avatar,
        authType: "google",
        password: null
      });

      // UserProfile mặc định
      const UserProfile = (await import("../models/UserProfile.js")).default;
      try {
        await UserProfile.create({
          userId: user._id,
          totalScore: 0,
          totalGamesPlayed: 0,
          totalCorrectAnswers: 0,
          totalWrongAnswers: 0,
          accuracyRate: 0,
          currentStreak: 0,
          longestStreak: 0,
          level: 1,
          rank: "bronze",
        });
      } catch (profileError) {
        console.warn("Failed to create user profile for Google user:", profileError);
      }
    }

    // Tạo Token JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Log Activity
    const UserActivity = (await import("../models/UserActivity.js")).default;
    try {
      await UserActivity.create({
        userId: user._id,
        action: "login",
        details: { method: "google" },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    } catch (e) {
      console.log(e);
    }

    res.status(200).json({
      message: "Google login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({
      message: "Lỗi xử lý đăng nhập Google",
      error: error.message,
    });
  }
};

// Đăng nhập
export const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Lỗi validate user",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Tìm user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    // Tạo token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

    // Log activity
    const UserActivity = (await import("../models/UserActivity.js")).default;
    try {
      await UserActivity.create({
        userId: user._id,
        action: "login",
        details: { method: "email" },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    } catch (activityError) {
      console.warn("Failed to log login activity:", activityError);
    }

    // return user res
    res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Lấy thông tin user hiện tại
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Lỗi lấy thông tin user:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Logout (client-side only, but we can log it)
export const logoutUser = async (req, res) => {
  try {
    // Log activity
    const UserActivity = (await import("../models/UserActivity.js")).default;
    try {
      await UserActivity.create({
        userId: req.user.id,
        action: "logout",
        details: {},
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    } catch (activityError) {
      console.warn("Failed to log logout activity:", activityError);
    }

    res.json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Lỗi logout:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();
    res.json({
      message: "Cập nhật profile thành công",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
