import express from "express";
import {
  getRandomExercise,
  getAllExercises,
  getExerciseById,
} from "../controllers/exerciseController.js";

const router = express.Router();

// Public
router.get("/random", getRandomExercise);
router.get("/", getAllExercises);
router.get("/:id", getExerciseById);

export default router;
