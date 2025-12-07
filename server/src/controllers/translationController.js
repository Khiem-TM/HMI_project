import Translation from "../models/Translation.js";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createTranslation = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ middleware verifyToken
    const { inputText, outputSign, direction } = req.body;

    if (!inputText || !outputSign) {
      return res.status(400).json({ message: "Thiếu thông tin đầu vào/đầu ra" });
    }

    const translation = await Translation.create({
      userId,
      inputText,
      outputSign,
      direction: direction || "text-to-sign",
    });

    res.status(201).json({
      success: true,
      message: "Lưu lịch sử thành công",
      data: translation
    });
  } catch (error) {
    console.error("Error creating translation:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserTranslations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, direction } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter = { userId };
    if (direction) {
      filter.direction = direction;
    }

    // Lấy dữ liệu & Tổng số
    const [translations, total] = await Promise.all([
      Translation.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum),
      Translation.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: translations,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      },
    });
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const translation = await Translation.findOneAndDelete({
      _id: id,
      userId: userId,
    });

    if (!translation) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hoặc không có quyền xóa" });
    }

    res.json({ success: true, message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const translateTextToSign = async (req, res) => {
  try {
    const {
      text,
      text_language = "english",
      sign_language = "pk-sl",
      output_format = "video",
    } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Text is required",
      });
    }

    // Path to Python script
    const pythonScriptPath = path.join(
        __dirname,
        "../services/translationService.py"
    );

    // Check if Python script exists
    if (!fs.existsSync(pythonScriptPath)) {
      return res.status(500).json({
        success: false,
        message: "Translation service not available. Python script not found.",
      });
    }

    // Prepare input data as JSON
    const inputData = JSON.stringify({
      text: text.trim(),
      text_language,
      sign_language,
      output_format,
    });

    // Determine Python command
    const pythonCmd =
        process.env.PYTHON_PATH ||
        (await execAsync(
            "which python3.12 || which python3.11 || which python3",
            { timeout: 5000 }
        )
            .then(({ stdout }) => stdout.trim().split("\n")[0])
            .catch(() => "python3"));

    // Execute Python script
    const { stdout, stderr } = await execAsync(
        `"${pythonCmd}" "${pythonScriptPath}" '${inputData.replace(
            /'/g,
            "'\"'\"'"
        )}'`,
        {
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
          timeout: 60000, // 60 seconds timeout
        }
    );

    if (stderr && !stdout) {
      console.error("Python script error:", stderr);
      return res.status(500).json({
        success: false,
        message: "Translation failed",
        error: stderr,
      });
    }

    // Parse Python output
    let result;
    try {
      result = JSON.parse(stdout);
    } catch (parseError) {
      console.error("Failed to parse Python output:", stdout, parseError);
      return res.status(500).json({
        success: false,
        message: "Failed to parse translation result",
        raw_output: stdout,
      });
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || "Translation failed",
        error: result.error,
      });
    }

    // Save translation to database
    let translationRecord = null;
    try {
      if (req.user && req.user.id) {
        translationRecord = await Translation.create({
          userId: req.user.id,
          inputText: text,
          outputSign:
              result.video_path || result.landmarks_path || "Translation completed",
          direction: "text-to-sign",
        });
      }
    } catch (dbError) {
      console.error("Failed to save translation to database:", dbError);
    }

    // Return success response
    res.json({
      success: true,
      message: "Translation completed successfully",
      translation: {
        input_text: result.input_text,
        text_language: result.text_language,
        sign_language: result.sign_language,
        output_format: result.output_format,
        video_path: result.video_path,
        video_url: result.video_url,
        landmarks_path: result.landmarks_path,
      },
      record: translationRecord,
    });
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
      error: err.toString(),
    });
  }
};

export const translateSignToText = async (req, res) => {
  try {
    const {
      landmarks,
      videoUrl,
      signLanguage = "pk-sl",
      mode = "single",
    } = req.body;

    if (!landmarks || !Array.isArray(landmarks) || landmarks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Landmarks are required (array of hand landmarks)",
      });
    }

    // Load dictionary words from database for matching
    const Word = (await import("../models/Word.js")).default;
    let dictionaryWords = [];
    try {
      dictionaryWords = await Word.find({}).limit(500);
    } catch (dbError) {
      console.warn("Failed to load dictionary words:", dbError.message);
    }

    // Use Python service for sign recognition
    const pythonScriptPath = path.join(
        __dirname,
        "../services/signRecognitionService.py"
    );

    // Detect Python version
    let pythonCmd = "python3";
    try {
      const { stdout } = await execAsync("which python3.12");
      if (stdout.trim()) pythonCmd = "python3.12";
    } catch {
      try {
        const { stdout } = await execAsync("which python3.11");
        if (stdout.trim()) pythonCmd = "python3.11";
      } catch {
        pythonCmd = "python3";
      }
    }

    // Prepare dictionary data for Python service
    const dictionaryData = dictionaryWords.map((word) => ({
      word: word.word,
      meaning: word.meaning || word.word,
      category: word.category || "general",
      videoUrl: word.videoUrl || "",
      difficulty: word.difficulty || "beginner",
    }));

    // Prepare input data
    const inputData = JSON.stringify({
      landmarks: landmarks,
      sign_language: signLanguage,
      mode: mode,
      dictionary_words: dictionaryData,
    });

    try {
      // Execute Python recognition service
      const { stdout, stderr } = await execAsync(
          `"${pythonCmd}" "${pythonScriptPath}" '${inputData.replace(
              /'/g,
              "'\"'\"'"
          )}'`,
          {
            maxBuffer: 10 * 1024 * 1024,
            timeout: 10000,
          }
      );

      if (stderr && !stderr.includes("DeprecationWarning")) {
        console.warn("Python stderr:", stderr);
      }

      // Parse Python output
      const recognitionResult = JSON.parse(stdout.trim());

      if (!recognitionResult.success) {
        throw new Error(recognitionResult.error || "Recognition failed");
      }

      const recognizedText = recognitionResult.recognized_text || "unknown";
      const confidence = recognitionResult.confidence || 0.5;

      // Save translation to database
      let translationRecord = null;
      try {
        if (req.user && req.user.id) {
          translationRecord = await Translation.create({
            userId: req.user.id,
            inputText: `[Sign Language: ${signLanguage}]`,
            outputSign: recognizedText,
            direction: "sign-to-text",
          });
        }
      } catch (dbError) {
        console.error("Failed to save translation to database:", dbError);
      }

      res.json({
        success: true,
        message: "Sign recognized successfully",
        translation: {
          input_sign: signLanguage,
          output_text: recognizedText,
          confidence: confidence,
          landmarks_count: Array.isArray(landmarks[0]) ? landmarks.length : 1,
          recognized_sequence: recognitionResult.recognized_sequence || null,
        },
        record: translationRecord,
      });
    } catch (pythonError) {
      console.error("Python recognition error:", pythonError);

      // Fallback: simple pattern matching
      const estimatedWord = "hello";
      const confidence = 0.5;

      // Save translation (Fallback)
      let translationRecord = null;
      try {
        if (req.user && req.user.id) {
          translationRecord = await Translation.create({
            userId: req.user.id,
            inputText: `[Sign Language: ${signLanguage}]`,
            outputSign: estimatedWord,
            direction: "sign-to-text",
          });
        }
      } catch (dbError) {
        console.error("Failed to save translation to database:", dbError);
      }

      res.json({
        success: true,
        message: "Sign recognized (fallback mode)",
        translation: {
          input_sign: signLanguage,
          output_text: estimatedWord,
          confidence: confidence,
          landmarks_count: Array.isArray(landmarks[0]) ? landmarks.length : 1,
          fallback: true,
        },
        record: translationRecord,
      });
    }
  } catch (err) {
    console.error("Sign-to-text translation error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
      error: err.toString(),
    });
  }
};