import mongoose from "mongoose";

const userAchievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Achievement",
      required: true,
    },
    unlockedAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 100, min: 0, max: 100 }, // percentage
  },
  { timestamps: true }
);

// Indexes
userAchievementSchema.index({ userId: 1 });
userAchievementSchema.index({ achievementId: 1 });
userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
userAchievementSchema.index({ unlockedAt: -1 });

export default mongoose.model("UserAchievement", userAchievementSchema);
