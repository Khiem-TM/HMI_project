/**
 * Middleware to require admin role
 * Must be used after verifyToken middleware
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

/**
 * Middleware to allow admin or the user themselves
 * Must be used after verifyToken middleware
 */
export const requireAdminOrSelf = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const targetUserId = req.params.id || req.params.userId;
  const isAdmin = req.user.role === "admin";
  const isSelf =
    req.user.id === targetUserId || req.user._id?.toString() === targetUserId;

  if (!isAdmin && !isSelf) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin or account owner required.",
    });
  }

  next();
};
