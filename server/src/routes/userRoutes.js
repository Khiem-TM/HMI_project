import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  logoutUser, loginWithGoogle,
} from "../controllers/userController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { body, validationResult } from "express-validator";

// Nhiệm vụ: Xác định các đường dẫn APi liên quan rồi gắn chúng vào hàm xử lý
// Express thường đc chia làm 3 tầng chính  ---> Models/ Controller / Route --> trong đó route dùng để define đường dẫn
const router = express.Router();
// validate middleware
const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Tên có ít nhất là từ 2 từ đổ lên"),
  body("email").isEmail().normalizeEmail().withMessage("Nhập lại email hợp lệ"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password có ít nhất 6 kí tự "),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Hãy cung cấp email hợp lệ"),
  body("password").notEmpty().withMessage("password is required"),
];

// middleware để xử lý validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

//public routes
router.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  registerUser
);
router.post("/login", loginValidation, handleValidationErrors, loginUser);
router.post("/google-login", loginWithGoogle);

// Protected routes
router.get("/me", verifyToken, getMe);
router.post("/logout", verifyToken, logoutUser);
router.put("/profile", verifyToken, updateProfile);
router.put("/password", verifyToken, changePassword);

export default router;
