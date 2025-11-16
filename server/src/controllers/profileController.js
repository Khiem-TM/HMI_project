import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";
import UserAchievement from "../models/UserAchievement.js";
import GameSession from "../models/GameSession.js";
import Achievement from "../models/Achievement.js";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      profile = await UserProfile.create({ userId });
    }

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        profile: profile.toObject(),
      },
    });
  } catch (error) {
    console.error("Error getting profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

export const getProfileStats = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { period = "all" } = req.query; // all, week, month, year

    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Calculate date range
    let dateFilter = {};
    if (period !== "all") {
      const now = new Date();
      let startDate;
      switch (period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "year":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
      dateFilter = { startedAt: { $gte: startDate } };
    }

    // Get game sessions for timeline
    const gameSessions = await GameSession.find({
      userId,
      isCompleted: true,
      ...dateFilter,
    })
      .sort({ startedAt: 1 })
      .select("score accuracy startedAt gameMode difficulty");

    // Group by category and difficulty
    const categoryStats = {};
    const difficultyStats = {};

    // Get detailed game sessions
    const detailedSessions = await GameSession.find({
      userId,
      isCompleted: true,
      ...dateFilter,
    }).populate("exercises", "category difficulty");

    detailedSessions.forEach((session) => {
      // Category stats
      session.exercises.forEach((exercise) => {
        if (exercise && exercise.category) {
          if (!categoryStats[exercise.category]) {
            categoryStats[exercise.category] = {
              gamesPlayed: 0,
              correctAnswers: 0,
              wrongAnswers: 0,
              score: 0,
            };
          }
          categoryStats[exercise.category].gamesPlayed += 1;
        }
      });

      // Difficulty stats
      if (session.difficulty) {
        if (!difficultyStats[session.difficulty]) {
          difficultyStats[session.difficulty] = {
            gamesPlayed: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            score: 0,
          };
        }
        difficultyStats[session.difficulty].gamesPlayed += 1;
        difficultyStats[session.difficulty].correctAnswers +=
          session.correctAnswers;
        difficultyStats[session.difficulty].wrongAnswers +=
          session.wrongAnswers;
        difficultyStats[session.difficulty].score += session.score;
      }
    });

    // Timeline data for charts
    const timeline = gameSessions.map((session) => ({
      date: session.startedAt,
      score: session.score,
      accuracy: session.accuracy,
      gameMode: session.gameMode,
    }));

    res.json({
      success: true,
      stats: {
        overview: {
          totalScore: profile.totalScore,
          totalGamesPlayed: profile.totalGamesPlayed,
          accuracyRate: profile.accuracyRate,
          currentStreak: profile.currentStreak,
          longestStreak: profile.longestStreak,
          level: profile.level,
          rank: profile.rank,
        },
        byCategory: categoryStats,
        byDifficulty: difficultyStats,
        timeline,
      },
    });
  } catch (error) {
    console.error("Error getting profile stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile stats",
      error: error.message,
    });
  }
};

/**
 * Get user achievements
 */
export const getAchievements = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    // Get all unlocked achievements
    const userAchievements = await UserAchievement.find({ userId })
      .populate("achievementId")
      .sort({ unlockedAt: -1 });

    // Get all available achievements
    const allAchievements = await Achievement.find({ isActive: true }).sort({
      category: 1,
      threshold: 1,
    });

    // Create map of unlocked achievements
    const unlockedMap = {};
    userAchievements.forEach((ua) => {
      if (ua.achievementId) {
        unlockedMap[ua.achievementId._id.toString()] = {
          unlocked: true,
          unlockedAt: ua.unlockedAt,
          progress: ua.progress,
        };
      }
    });

    // Combine all achievements with unlock status
    const achievements = allAchievements.map((achievement) => {
      const unlockInfo = unlockedMap[achievement._id.toString()] || {
        unlocked: false,
        progress: 0,
      };
      return {
        ...achievement.toObject(),
        ...unlockInfo,
      };
    });

    res.json({
      success: true,
      achievements,
      unlockedCount: userAchievements.length,
      totalCount: allAchievements.length,
    });
  } catch (error) {
    console.error("Error getting achievements:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching achievements",
      error: error.message,
    });
  }
};

/**
 * Get leaderboard
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = "totalScore" } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortOptions = {
      totalScore: { totalScore: -1 },
      level: { level: -1, totalScore: -1 },
      accuracy: { accuracyRate: -1 },
      streak: { longestStreak: -1 },
    };

    const sort = sortOptions[sortBy] || sortOptions.totalScore;

    // Get top profiles
    const profiles = await UserProfile.find()
      .populate("userId", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await UserProfile.countDocuments();

    // Calculate ranks
    const leaderboard = profiles.map((profile, index) => ({
      rank: skip + index + 1,
      user: profile.userId,
      totalScore: profile.totalScore,
      level: profile.level,
      rank: profile.rank,
      accuracyRate: profile.accuracyRate,
      longestStreak: profile.longestStreak,
      totalGamesPlayed: profile.totalGamesPlayed,
    }));

    res.json({
      success: true,
      leaderboard,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching leaderboard",
      error: error.message,
    });
  }
};

/**
 * Get user's rank in leaderboard
 */
export const getUserRank = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Count users with higher score
    const rank =
      (await UserProfile.countDocuments({
        $or: [
          { totalScore: { $gt: profile.totalScore } },
          {
            totalScore: profile.totalScore,
            _id: { $lt: profile._id },
          },
        ],
      })) + 1;

    // Get total users
    const totalUsers = await UserProfile.countDocuments();

    res.json({
      success: true,
      rank,
      totalUsers,
      percentile: Math.round(((totalUsers - rank) / totalUsers) * 100),
      profile: {
        totalScore: profile.totalScore,
        level: profile.level,
        rank: profile.rank,
      },
    });
  } catch (error) {
    console.error("Error getting user rank:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user rank",
      error: error.message,
    });
  }
};
