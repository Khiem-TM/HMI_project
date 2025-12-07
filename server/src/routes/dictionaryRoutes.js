import express from "express";
import {
  searchWords,
  getWordById,
  getCategories,
  getWordsByCategory,
} from "../controllers/dictionaryController.js";


const router = express.Router();

router.get("/", searchWords);

router.get("/categories", getCategories);
router.get("/category/:category", getWordsByCategory);
router.get("/word/:id", getWordById);

export default router;