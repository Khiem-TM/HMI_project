import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserProfile from "../models/UserProfile.js";
import UserActivity from "../models/UserActivity.js";
import GameSession from "../models/GameSession.js";
import Translation from "../models/Translation.js";

export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "",
      isActive = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (isActive !== "") {
      query.isActive = isActive === "true";
    }

    query.deletedAt = { $exists: false };

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const users = await User.find(query)
      .select("-password")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    const userIds = users.map((u) => u._id);
    const profiles = await UserProfile.find({ userId: { $in: userIds } });

    const profileMap = {};
    profiles.forEach((p) => {
      profileMap[p.userId.toString()] = p;
    });

    const usersWithProfile = users.map((user) => {
      const userObj = user.toObject();
      const profile = profileMap[user._id.toString()];
      return {
        ...userObj,
        profile: profile || null,
      };
    });

    res.json({
      success: true,
      users: usersWithProfile,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");
    if (!user || user.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const profile = await UserProfile.findOne({ userId: id });

    const gameSessionsCount = await GameSession.countDocuments({ userId: id });
    const translationsCount = await Translation.countDocuments({ userId: id });

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        profile: profile || null,
        stats: {
          gameSessions: gameSessionsCount,
          translations: translationsCount,
        },
      },
    });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

export const getUserActivities = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, action = "" } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const user = await User.findById(id);
    if (!user || user.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const query = { userId: id };
    if (action) {
      query.action = action;
    }

    const activities = await UserActivity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await UserActivity.countDocuments(query);

    res.json({
      success: true,
      activities,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Error getting user activities:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching activities",
      error: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id === id || req.user._id?.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.deletedAt) {
      return res.status(400).json({
        success: false,
        message: "User already deleted",
      });
    }

    user.deletedAt = new Date();
    user.isActive = false;
    await user.save();

    await UserActivity.create({
      userId: id,
      action: "profile_update",
      details: { action: "deleted_by_admin", adminId: req.user.id },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

export const getSystemStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalAdmins,
      totalProfiles,
      totalGameSessions,
      totalTranslations,
      recentActivities,
    ] = await Promise.all([
      User.countDocuments({ deletedAt: { $exists: false } }),
      User.countDocuments({ isActive: true, deletedAt: { $exists: false } }),
      User.countDocuments({ role: "admin", deletedAt: { $exists: false } }),
      UserProfile.countDocuments(),
      GameSession.countDocuments(),
      Translation.countDocuments(),
      UserActivity.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userId", "name email"),
    ]);

    // Get top
    const topUsers = await UserProfile.find()
      .sort({ totalScore: -1 })
      .limit(10)
      .populate("userId", "name email");

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          admins: totalAdmins,
        },
        content: {
          profiles: totalProfiles,
          gameSessions: totalGameSessions,
          translations: totalTranslations,
        },
        topUsers: topUsers.map((p) => ({
          user: p.userId,
          totalScore: p.totalScore,
          level: p.level,
          rank: p.rank,
        })),
        recentActivities,
      },
    });
  } catch (error) {
    console.error("Error getting system stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching system stats",
      error: error.message,
    });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || user.role !== "admin") {
      return res
        .status(401)
        .json({ message: "Admin không tồn tại hoặc không có quyền" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Mật khẩu không đúng" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    user.lastLoginAt = new Date();
    await user.save();
    res.json({
      message: "Đăng nhập admin thành công",
      token,
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

export const getAdminProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Yêu cầu quyền admin" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
