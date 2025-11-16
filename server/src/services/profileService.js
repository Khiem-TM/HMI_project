import UserProfile from "../models/UserProfile.js";

export const calculateLevel = (totalScore) => {
  return Math.floor(totalScore / 500) + 1;
};

export const calculateRank = (level, totalScore) => {
  if (totalScore >= 50000) return "diamond";
  if (totalScore >= 20000) return "platinum";
  if (totalScore >= 10000) return "gold";
  if (totalScore >= 5000) return "silver";
  return "bronze";
};

export const updateAccuracyRate = (totalCorrect, totalWrong) => {
  const total = totalCorrect + totalWrong;
  if (total === 0) return 0;
  return Math.round((totalCorrect / total) * 100);
};

export const updateStreak = async (userId) => {
  try {
    const profile = await UserProfile.findOne({ userId });
    if (!profile) return;

    const now = new Date();
    const lastPlayed = profile.lastPlayedAt
      ? new Date(profile.lastPlayedAt)
      : null;

    // Reset time to midnight for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastPlayedDate = lastPlayed
      ? new Date(
          lastPlayed.getFullYear(),
          lastPlayed.getMonth(),
          lastPlayed.getDate()
        )
      : null;

    let newStreak = profile.currentStreak || 0;

    if (!lastPlayedDate) {
      // First time playing
      newStreak = 1;
    } else if (lastPlayedDate.getTime() === today.getTime()) {
    } else {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastPlayedDate.getTime() === yesterday.getTime()) {
        newStreak = (profile.currentStreak || 0) + 1;
      } else {
        newStreak = 1;
      }
    }

    const longestStreak = Math.max(profile.longestStreak || 0, newStreak);

    await UserProfile.updateOne(
      { userId },
      {
        currentStreak: newStreak,
        longestStreak,
        lastPlayedAt: now,
      }
    );

    return { currentStreak: newStreak, longestStreak };
  } catch (error) {
    console.error("Error updating streak:", error);
    return null;
  }
};

export const updateStatsByCategory = async (userId, category, statsUpdate) => {
  try {
    const profile = await UserProfile.findOne({ userId });
    if (!profile) return;

    const currentStats = profile.statsByCategory.get(category) || {
      gamesPlayed: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      score: 0,
    };

    const updatedStats = {
      gamesPlayed:
        (currentStats.gamesPlayed || 0) + (statsUpdate.gamesPlayed || 0),
      correctAnswers:
        (currentStats.correctAnswers || 0) + (statsUpdate.correctAnswers || 0),
      wrongAnswers:
        (currentStats.wrongAnswers || 0) + (statsUpdate.wrongAnswers || 0),
      score: (currentStats.score || 0) + (statsUpdate.score || 0),
    };

    profile.statsByCategory.set(category, updatedStats);
    await profile.save();
  } catch (error) {
    console.error("Error updating stats by category:", error);
  }
};

export const updateStatsByDifficulty = async (
  userId,
  difficulty,
  statsUpdate
) => {
  try {
    const profile = await UserProfile.findOne({ userId });
    if (!profile) return;

    const currentStats = profile.statsByDifficulty.get(difficulty) || {
      gamesPlayed: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      score: 0,
    };

    const updatedStats = {
      gamesPlayed:
        (currentStats.gamesPlayed || 0) + (statsUpdate.gamesPlayed || 0),
      correctAnswers:
        (currentStats.correctAnswers || 0) + (statsUpdate.correctAnswers || 0),
      wrongAnswers:
        (currentStats.wrongAnswers || 0) + (statsUpdate.wrongAnswers || 0),
      score: (currentStats.score || 0) + (statsUpdate.score || 0),
    };

    profile.statsByDifficulty.set(difficulty, updatedStats);
    await profile.save();
  } catch (error) {
    console.error("Error updating stats by difficulty:", error);
  }
};

export const updateProfileAfterGame = async (userId, gameSessionData) => {
  try {
    const {
      score = 0,
      correctAnswers = 0,
      wrongAnswers = 0,
      category,
      difficulty,
    } = gameSessionData;

    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      profile = await UserProfile.create({ userId });
    }

    profile.totalScore += score;
    profile.totalGamesPlayed += 1;
    profile.totalCorrectAnswers += correctAnswers;
    profile.totalWrongAnswers += wrongAnswers;

    profile.accuracyRate = updateAccuracyRate(
      profile.totalCorrectAnswers,
      profile.totalWrongAnswers
    );

    // Calculate level
    profile.level = calculateLevel(profile.totalScore);

    // Calculate rank
    profile.rank = calculateRank(profile.level, profile.totalScore);

    // Update streak
    await updateStreak(userId);

    // Update category stats
    if (category) {
      await updateStatsByCategory(userId, category, {
        gamesPlayed: 1,
        correctAnswers,
        wrongAnswers,
        score,
      });
    }

    // Update difficulty stats
    if (difficulty) {
      await updateStatsByDifficulty(userId, difficulty, {
        gamesPlayed: 1,
        correctAnswers,
        wrongAnswers,
        score,
      });
    }

    // Save profile
    await profile.save();

    return profile;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
