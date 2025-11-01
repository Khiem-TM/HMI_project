import Word from "../models/Word.js";

// Tìm từ trong từ điển
export const searchWords = async (req, res) => {
  try {
    const { word, category, difficulty, page = 1, limit = 10 } = req.query;

    // Tạo query object
    const query = {};

    if (word) {
      query.word = { $regex: word, $options: "i" };
    }

    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Tính toán phân trang
    const skip = (page - 1) * limit;

    // Lấy danh sách từ từ database
    const words = await Word.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ word: 1 });

    // Đếm tổng số từ để phân trang
    const total = await Word.countDocuments(query);

    res.json({
      words,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (err) {
    console.error("Lỗi tìm kiếm từ:", err);
    res.status(500).json({ message: err.message });
  }
};

// Lấy từ theo ID
export const getWordById = async (req, res) => {
  try {
    const { id } = req.params;
    const word = await Word.findById(id);

    if (!word) {
      return res.status(404).json({ message: "Không tìm thấy từ" });
    }

    res.json(word);
  } catch (err) {
    console.error("Lỗi lấy từ theo ID:", err);
    res.status(500).json({ message: err.message });
  }
};

// Lấy danh sách categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Word.distinct("category");
    res.json(categories);
  } catch (err) {
    console.error("Lỗi lấy categories:", err);
    res.status(500).json({ message: err.message });
  }
};

// Lấy từ theo category
export const getWordsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const words = await Word.find({ category }).sort({ word: 1 });
    res.json(words);
  } catch (err) {
    console.error("Lỗi lấy từ theo category:", err);
    res.status(500).json({ message: err.message });
  }
};
