import express from "express";
import {
  createTranslation,
  getUserTranslations,
  deleteTranslation,
} from "../controllers/translationController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { body } from "express-validator";

// Luồng: Gửi req --> Check JWT token --> Validate input --> Save to DB --> Gửi json res về client
const router = express.Router();

// Validate cho input
const translationValidation = [
  body("inputText").trim().notEmpty().withMessage("Input text is required"),
  body("outputSign").trim().notEmpty().withMessage("Output sign is required"),
  body("direction")
    .isIn(["text-to-sign", "sign-to-text"])
    .withMessage("Invalid direction"),
];

router.use(verifyToken);

// Check input  --> POST khi ok
router.post("/", translationValidation, createTranslation);

router.get("/", getUserTranslations);

router.delete("/:id", deleteTranslation);

export default router;
