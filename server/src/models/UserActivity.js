import mongoose from "mongoose";

const userActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "login",
        "logout",
        "game_start",
        "game_complete",
        "translation",
        "dictionary_search",
        "profile_update",
      ],
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: { type: String },
    userAgent: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes
userActivitySchema.index({ userId: 1 });
userActivitySchema.index({ createdAt: -1 });
userActivitySchema.index({ action: 1 });
userActivitySchema.index({ userId: 1, createdAt: -1 });
userActivitySchema.index({ userId: 1, action: 1 });

export default mongoose.model("UserActivity", userActivitySchema);
