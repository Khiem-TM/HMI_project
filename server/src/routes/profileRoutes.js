import express from "express";
import {
  getProfile,
  getProfileStats,
  getAchievements,
} from "../controllers/profileController.js";
import { getGameHistory } from "../controllers/gameController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", getProfile);

router.get("/stats", getProfileStats);

router.get("/achievements", getAchievements);

router.get("/game-history", getGameHistory);

export default router;
