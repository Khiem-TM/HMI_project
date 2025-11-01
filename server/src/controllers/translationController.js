import Translation from "../models/Translation.js";

// create new translation
export const createTranslation = async (req, res) => {
  try {
    const { inputText, outputSign, direction } = req.body;

    const translation = await Translation.create({
      userId: req.user.id,
      inputText,
      outputSign,
      direction,
    });

    res.status(201).json({ message: "Tạo bản dịch thành công", translation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách bản dịch của user
export const getUserTranslations = async (req, res) => {
  try {
    const { page = 1, limit = 10, direction } = req.query;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user.id };
    if (direction) {
      filter.direction = direction;
    }

    const translations = await Translation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Translation.countDocuments(filter);

    res.json({
      translations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Xóa bản dịch
export const deleteTranslation = async (req, res) => {
  try {
    const { id } = req.params;

    const translation = await Translation.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!translation) {
      return res.status(404).json({ message: "Không tìm thấy bản dịch" });
    }

    res.json({ message: "Xóa bản dịch thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
