export const saveSession = async (req, res) => {
  try {
    const {
      gameMode,
      difficulty,
      score = 0,
      correctAnswers = 0,
      wrongAnswers = 0,
      totalQuestions = 0,
      timeSpent = 0,
      exercises = [],
      answers = [],
    } = req.body || {};

    const unlockedAchievements = [];

    if (score >= 50) {
      unlockedAchievements.push({
        name: "Score 50+",
        description: "Đạt trên 50 điểm trong một phiên",
        points: 10,
      });
    }

    if (correctAnswers >= 5) {
      unlockedAchievements.push({
        name: "5 câu đúng",
        description: "Trả lời đúng 5 câu",
        points: 5,
      });
    }

    if (difficulty === "advanced" && score >= 30) {
      unlockedAchievements.push({
        name: "Advanced starter",
        description: "Ghi điểm ở chế độ nâng cao",
        points: 10,
      });
    }

    res.json({
      success: true,
      message: "Session recorded",
      data: {
        gameMode,
        difficulty,
        score,
        correctAnswers,
        wrongAnswers,
        totalQuestions,
        timeSpent,
        exercisesCount: Array.isArray(exercises) ? exercises.length : 0,
        answersCount: Array.isArray(answers) ? answers.length : 0,
      },
      unlockedAchievements,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  res.json({ success: true, leaderboard: [] });
};

export const getGameHistory = async (req, res) => {
  res.json({ success: true, history: [] });
};

