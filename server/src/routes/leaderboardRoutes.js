import express from "express";
import {
  getLeaderboard,
  getUserRank,
} from "../controllers/profileController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
// demo --> chưa dđược dùng
const router = express.Router();

router.get("/", getLeaderboard);

router.get("/rank", verifyToken, getUserRank);

export default router;
