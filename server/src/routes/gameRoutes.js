import express from "express";
import { saveSession, getLeaderboard } from "../controllers/gameController.js";

const router = express.Router();

router.post("/sessions", saveSession);
router.get("/leaderboard", getLeaderboard);

export default router;

