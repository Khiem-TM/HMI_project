import express from "express";
import { chatbotController } from "../controllers/chatbotController.js";

const router = express.Router();

// POST /api/chatbot/ask - Gửi câu hỏi
router.post("/ask", chatbotController.askQuestion);

// GET /api/chatbot/knowledge - Lấy thông tin từ knowledge base
router.get("/knowledge", chatbotController.getKnowledge);

// POST /api/chatbot/search - Tìm kiếm trong knowledge base
router.post("/search", chatbotController.searchKnowledge);

export default router;