import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";
import UserAchievement from "../models/UserAchievement.js";
import GameSession from "../models/GameSession.js";
import Achievement from "../models/Achievement.js";

const calculateRankAndLevel = (totalScore) => {
  const level = Math.floor(totalScore / 100) + 1;

  let rank = "bronze";
  if (totalScore >= 5000) rank = "diamond";      // > 5000: Kim Cương
  else if (totalScore >= 2500) rank = "platinum"; // > 2500: Bạch Kim
  else if (totalScore >= 1000) rank = "gold";     // > 1000: Vàng
  else if (totalScore >= 500) rank = "silver";    // > 500: Bạc
  else if (totalScore >= 0) rank = "bronze";

  return { level, rank };
};


export const saveSession = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.user.id;
    const {
      gameMode, difficulty, score = 0, correctAnswers = 0,
      wrongAnswers = 0, totalQuestions = 0, timeSpent = 0,
      exercises = [], answers = [],
    } = req.body;


    const newSession = await GameSession.create({
      userId, gameMode, difficulty, score, correctAnswers,
      wrongAnswers, totalQuestions, timeSpent, exercises,
      answers, isCompleted: true,
    });

    const userProfile = await UserProfile.findOne({ userId });
    if (userProfile) {
      userProfile.totalScore += score;
      userProfile.totalGamesPlayed += 1;
      userProfile.totalCorrectAnswers += correctAnswers;
      userProfile.totalWrongAnswers += wrongAnswers;
      userProfile.lastPlayedAt = new Date();

      const { rank, level } = calculateRankAndLevel(userProfile.totalScore);
      userProfile.rank = rank;
      userProfile.level = level;

      await userProfile.save();
    }

    res.json({
      success: true,
      message: "Session saved & Rank updated",
      data: newSession,
      newRank: userProfile?.rank,
      newLevel: userProfile?.level
    });

  } catch (error) {
    console.error("Error saving session:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const startSession = async (req, res) => {
  res.json({ success: true, message: "Session started" });
};

export const getLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = "totalScore" } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {
      totalScore: { totalScore: -1, accuracyRate: -1, totalGamesPlayed: 1, _id: 1 },
      level: { level: -1, totalScore: -1 },
      accuracy: { accuracyRate: -1, totalScore: -1 },
      streak: { longestStreak: -1, totalScore: -1 },
    };

    const sort = sortOptions[sortBy] || sortOptions.totalScore;

    const profiles = await UserProfile.find()
        .populate("userId", "name avatar email")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();

    const total = await UserProfile.countDocuments();

    const leaderboard = profiles
        .filter(p => p.userId)
        .map((profile, index) => {
          const { rank, level } = calculateRankAndLevel(profile.totalScore);

          return {
            _id: profile._id,
            rank: skip + index + 1,
            userId: {
              _id: profile.userId._id,
              name: profile.userId.name || "Unknown",
              avatar: profile.userId.avatar || "",
              email: profile.userId.email
            },
            totalScore: profile.totalScore,
            level: level,
            rankTitle: rank,
            accuracyRate: profile.accuracyRate,
            longestStreak: profile.longestStreak,
            totalGamesPlayed: profile.totalGamesPlayed,
          };
        });

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
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    let profile = await UserProfile.findOne({ userId });
    if (!profile) profile = await UserProfile.create({ userId });

    const { rank, level } = calculateRankAndLevel(profile.totalScore);
    if (profile.rank !== rank || profile.level !== level) {
      profile.rank = rank;
      profile.level = level;
      await profile.save();
    }

    res.json({
      success: true,
      user: { ...user.toObject(), profile: profile.toObject() },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfileStats = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { period = "all" } = req.query;

    const profile = await UserProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    // Calculate date range
    let dateFilter = {};
    if (period !== "all") {
      const now = new Date();
      let startDate;
      switch (period) {
        case "week": startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case "month": startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
        case "year": startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      }
      dateFilter = { startedAt: { $gte: startDate } };
    }

    // Get game sessions for timeline
    const gameSessions = await GameSession.find({ userId, isCompleted: true, ...dateFilter })
        .sort({ startedAt: 1 })
        .select("score accuracy startedAt gameMode difficulty");

    const categoryStats = {};
    const difficultyStats = {};
    const detailedSessions = await GameSession.find({ userId, isCompleted: true, ...dateFilter })
        .populate("exercises", "category difficulty");

    detailedSessions.forEach((session) => {
      session.exercises.forEach((exercise) => {
        if (exercise && exercise.category) {
          if (!categoryStats[exercise.category]) {
            categoryStats[exercise.category] = { gamesPlayed: 0, correctAnswers: 0, wrongAnswers: 0, score: 0 };
          }
          categoryStats[exercise.category].gamesPlayed += 1;
        }
      });
      if (session.difficulty) {
        if (!difficultyStats[session.difficulty]) {
          difficultyStats[session.difficulty] = { gamesPlayed: 0, correctAnswers: 0, wrongAnswers: 0, score: 0 };
        }
        difficultyStats[session.difficulty].gamesPlayed += 1;
        difficultyStats[session.difficulty].correctAnswers += session.correctAnswers;
        difficultyStats[session.difficulty].wrongAnswers += session.wrongAnswers;
        difficultyStats[session.difficulty].score += session.score;
      }
    });

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
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAchievements = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userAchievements = await UserAchievement.find({ userId }).populate("achievementId").sort({ unlockedAt: -1 });
    const allAchievements = await Achievement.find({ isActive: true }).sort({ category: 1, threshold: 1 });

    const unlockedMap = {};
    userAchievements.forEach((ua) => {
      if (ua.achievementId) unlockedMap[ua.achievementId._id.toString()] = { unlocked: true, unlockedAt: ua.unlockedAt, progress: ua.progress };
    });

    const achievements = allAchievements.map((achievement) => {
      const unlockInfo = unlockedMap[achievement._id.toString()] || { unlocked: false, progress: 0 };
      return { ...achievement.toObject(), ...unlockInfo };
    });

    res.json({ success: true, achievements, unlockedCount: userAchievements.length, totalCount: allAchievements.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserRank = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const profile = await UserProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    const rank = (await UserProfile.countDocuments({
      $or: [
        { totalScore: { $gt: profile.totalScore } },
        { totalScore: profile.totalScore, _id: { $lt: profile._id } }, // Logic sort giống leaderboard
      ],
    })) + 1;

    const totalUsers = await UserProfile.countDocuments();

    res.json({
      success: true, rank, totalUsers,
      percentile: Math.round(((totalUsers - rank) / totalUsers) * 100),
      profile: { totalScore: profile.totalScore, level: profile.level, rank: profile.rank },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGameHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await GameSession.find({ userId }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};