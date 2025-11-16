import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalScore: { type: Number, default: 0, min: 0 },
    totalGamesPlayed: { type: Number, default: 0, min: 0 },
    totalCorrectAnswers: { type: Number, default: 0, min: 0 },
    totalWrongAnswers: { type: Number, default: 0, min: 0 },
    accuracyRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      get: function () {
        const total = this.totalCorrectAnswers + this.totalWrongAnswers;
        if (total === 0) return 0;
        return Math.round((this.totalCorrectAnswers / total) * 100);
      },
    },
    currentStreak: { type: Number, default: 0, min: 0 }, // days
    longestStreak: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    rank: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum", "diamond"],
      default: "bronze",
    },
    lastPlayedAt: { type: Date },
    statsByCategory: {
      type: Map,
      of: {
        gamesPlayed: { type: Number, default: 0 },
        correctAnswers: { type: Number, default: 0 },
        wrongAnswers: { type: Number, default: 0 },
        score: { type: Number, default: 0 },
      },
      default: {},
    },
    statsByDifficulty: {
      type: Map,
      of: {
        gamesPlayed: { type: Number, default: 0 },
        correctAnswers: { type: Number, default: 0 },
        wrongAnswers: { type: Number, default: 0 },
        score: { type: Number, default: 0 },
      },
      default: {},
    },
  },
  { timestamps: true }
);

// Indexes
userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ totalScore: -1 });
userProfileSchema.index({ level: -1 });
userProfileSchema.index({ rank: 1 });

// Ensure accuracyRate is calculated
userProfileSchema.pre("save", function (next) {
  const total = this.totalCorrectAnswers + this.totalWrongAnswers;
  if (total > 0) {
    this.accuracyRate = Math.round((this.totalCorrectAnswers / total) * 100);
  } else {
    this.accuracyRate = 0;
  }
  next();
});

export default mongoose.model("UserProfile", userProfileSchema);
