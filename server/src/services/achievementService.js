import Achievement from "../models/Achievement.js";
import UserAchievement from "../models/UserAchievement.js";
import UserProfile from "../models/UserProfile.js";

export const checkScoreAchievements = async (userId, newTotalScore) => {
  try {
    const scoreAchievements = await Achievement.find({
      category: "score",
      isActive: true,
      threshold: { $lte: newTotalScore },
    });

    const unlockedAchievements = [];

    for (const achievement of scoreAchievements) {
      // Check
      const existing = await UserAchievement.findOne({
        userId,
        achievementId: achievement._id,
      });

      if (!existing) {
        // Unlock
        await UserAchievement.create({
          userId,
          achievementId: achievement._id,
          progress: 100,
        });

        if (achievement.points > 0) {
          await UserProfile.updateOne(
            { userId },
            { $inc: { totalScore: achievement.points } }
          );
        }

        unlockedAchievements.push(achievement);
      }
    }

    return unlockedAchievements;
  } catch (error) {
    console.error("Error checking score achievements:", error);
    return [];
  }
};

export const checkStreakAchievements = async (userId, currentStreak) => {
  try {
    const streakAchievements = await Achievement.find({
      category: "streak",
      isActive: true,
      threshold: { $lte: currentStreak },
    });

    const unlockedAchievements = [];

    for (const achievement of streakAchievements) {
      const existing = await UserAchievement.findOne({
        userId,
        achievementId: achievement._id,
      });

      if (!existing) {
        await UserAchievement.create({
          userId,
          achievementId: achievement._id,
          progress: 100,
        });

        if (achievement.points > 0) {
          await UserProfile.updateOne(
            { userId },
            { $inc: { totalScore: achievement.points } }
          );
        }

        unlockedAchievements.push(achievement);
      }
    }

    return unlockedAchievements;
  } catch (error) {
    console.error("Error checking streak achievements:", error);
    return [];
  }
};

export const checkAccuracyAchievements = async (userId, accuracyRate) => {
  try {
    const accuracyAchievements = await Achievement.find({
      category: "accuracy",
      isActive: true,
      threshold: { $lte: accuracyRate },
    });

    const unlockedAchievements = [];

    for (const achievement of accuracyAchievements) {
      const existing = await UserAchievement.findOne({
        userId,
        achievementId: achievement._id,
      });

      if (!existing) {
        await UserAchievement.create({
          userId,
          achievementId: achievement._id,
          progress: 100,
        });

        if (achievement.points > 0) {
          await UserProfile.updateOne(
            { userId },
            { $inc: { totalScore: achievement.points } }
          );
        }

        unlockedAchievements.push(achievement);
      }
    }

    return unlockedAchievements;
  } catch (error) {
    console.error("Error checking accuracy achievements:", error);
    return [];
  }
};

export const checkGameCountAchievements = async (userId, totalGamesPlayed) => {
  try {
    const gameAchievements = await Achievement.find({
      category: "games",
      isActive: true,
      threshold: { $lte: totalGamesPlayed },
    });

    const unlockedAchievements = [];

    for (const achievement of gameAchievements) {
      const existing = await UserAchievement.findOne({
        userId,
        achievementId: achievement._id,
      });

      if (!existing) {
        await UserAchievement.create({
          userId,
          achievementId: achievement._id,
          progress: 100,
        });

        if (achievement.points > 0) {
          await UserProfile.updateOne(
            { userId },
            { $inc: { totalScore: achievement.points } }
          );
        }

        unlockedAchievements.push(achievement);
      }
    }

    return unlockedAchievements;
  } catch (error) {
    console.error("Error checking game count achievements:", error);
    return [];
  }
};

export const checkAllAchievements = async (userId) => {
  try {
    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return [];
    }

    const allUnlocked = [];

    const [
      scoreAchievements,
      streakAchievements,
      accuracyAchievements,
      gameAchievements,
    ] = await Promise.all([
      checkScoreAchievements(userId, profile.totalScore),
      checkStreakAchievements(userId, profile.currentStreak),
      checkAccuracyAchievements(userId, profile.accuracyRate),
      checkGameCountAchievements(userId, profile.totalGamesPlayed),
    ]);

    allUnlocked.push(
      ...scoreAchievements,
      ...streakAchievements,
      ...accuracyAchievements,
      ...gameAchievements
    );

    return allUnlocked;
  } catch (error) {
    console.error("Error checking all achievements:", error);
    return [];
  }
};

export const unlockAchievement = async (userId, achievementId) => {
  try {
    // Check if already unlocked
    const existing = await UserAchievement.findOne({
      userId,
      achievementId,
    });

    if (existing) {
      return { success: false, message: "Achievement already unlocked" };
    }

    // Check if achievement exists
    const achievement = await Achievement.findById(achievementId);
    if (!achievement || !achievement.isActive) {
      return { success: false, message: "Achievement not found or inactive" };
    }

    // Unlock achievement
    await UserAchievement.create({
      userId,
      achievementId,
      progress: 100,
    });

    // Add points if any
    if (achievement.points > 0) {
      await UserProfile.updateOne(
        { userId },
        { $inc: { totalScore: achievement.points } }
      );
    }

    return { success: true, achievement };
  } catch (error) {
    console.error("Error unlocking achievement:", error);
    return { success: false, message: error.message };
  }
};
