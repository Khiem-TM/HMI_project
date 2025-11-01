import Exercise from "../models/Exercise.js";

// random
export const getRandomExercise = async (req, res) => {
  try {
    const { difficulty } = req.query;

    const query = {};
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // random pick
    const exercises = await Exercise.aggregate([
      { $match: query },
      { $sample: { size: 1 } },
    ]);

    if (exercises.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bài tập" });
    }

    res.json(exercises[0]);
  } catch (Error) {
    console.error("Lỗi lấy bài tập ngẫu nhiên:", Error);
    res.status(500).json({ message: Error.message });
  }
};

// demo
// Lấy tất cả bài tập
export const getAllExercises = async (req, res) => {
  try {
    const { difficulty, category, limit = 10 } = req.query;
    const query = {};

    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;

    const exercises = await Exercise.find(query)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ exercises, total: exercises.length });
  } catch (err) {
    console.error("Lỗi lấy danh sách bài tập:", err);
    res.status(500).json({ message: err.message });
  }
};

// Lấy bài tập theo ID
export const getExerciseById = async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await Exercise.findById(id);

    if (!exercise) {
      return res.status(404).json({ message: "Không tìm thấy bài tập" });
    }

    res.json(exercise);
  } catch (err) {
    console.error("Lỗi lấy bài tập theo ID:", err);
    res.status(500).json({ message: err.message });
  }
};
