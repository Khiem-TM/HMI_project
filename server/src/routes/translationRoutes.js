import express from "express";
import {
  createTranslation,
  getUserTranslations,
  deleteTranslation,
  translateSignToText,
  translateTextToSign,
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

// using python service
const translateValidation = [
  body("text").trim().notEmpty().withMessage("Text is required"),
  body("text_language")
    .optional()
    .isIn(["english", "urdu", "hindi"])
    .withMessage("Invalid text language"),
  body("sign_language")
    .optional()
    .isString()
    .withMessage("Invalid sign language"),
  body("output_format")
    .optional()
    .isIn(["video", "landmarks"])
    .withMessage("Invalid output format"),
];

router.post("/translate", translateValidation, translateTextToSign);

const signToTextValidation = [
  body("landmarks").isArray().withMessage("Landmarks must be an array"),
  body("landmarks.*").isArray().withMessage("Each landmark must be an array"),
  body("sign_language")
    .optional()
    .isString()
    .withMessage("Invalid sign language"),
  body("videoUrl").optional().isString().withMessage("Invalid video URL"),
];

router.post("/sign-to-text", signToTextValidation, translateSignToText);

//  endpoints
router.post("/", translationValidation, createTranslation);

router.get("/", getUserTranslations);

router.delete("/:id", deleteTranslation);

export default router;
