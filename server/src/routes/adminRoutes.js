import express from "express";
import {
  getAllUsers,
  getUserById,
  getUserActivities,
  deleteUser,
  getSystemStats,
  adminLogin,
  getAdminProfile,
} from "../controllers/adminController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/login", adminLogin);

router.use(verifyToken);
router.use(requireAdmin);

router.get("/users", getAllUsers);

router.get("/users/:id", getUserById);

router.get("/users/:id/activities", getUserActivities);

router.delete("/users/:id", deleteUser);

router.get("/stats", getSystemStats);

router.get("/me", getAdminProfile);

export default router;
