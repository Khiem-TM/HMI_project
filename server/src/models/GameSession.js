import mongoose from "mongoose";

const gameSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gameMode: {
      type: String,
      enum: ["guess", "speed-match", "timed"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
    },
    score: { type: Number, default: 0, min: 0 },
    correctAnswers: { type: Number, default: 0, min: 0 },
    wrongAnswers: { type: Number, default: 0, min: 0 },
    totalQuestions: { type: Number, default: 0, min: 0 },
    timeSpent: { type: Number, min: 0 }, // seconds
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
      get: function () {
        if (this.totalQuestions === 0) return 0;
        return Math.round((this.correctAnswers / this.totalQuestions) * 100);
      },
    },
    exercises: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise",
      },
    ],
    answers: [
      {
        exerciseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Exercise",
        },
        userAnswer: String,
        isCorrect: Boolean,
        timeSpent: Number,
      },
    ],
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
gameSessionSchema.index({ userId: 1 });
gameSessionSchema.index({ startedAt: -1 });
gameSessionSchema.index({ gameMode: 1 });
gameSessionSchema.index({ score: -1 });
gameSessionSchema.index({ userId: 1, startedAt: -1 });

gameSessionSchema.pre("save", function (next) {
  if (this.totalQuestions > 0) {
    this.accuracy = Math.round(
      (this.correctAnswers / this.totalQuestions) * 100
    );
  } else {
    this.accuracy = 0;
  }
  if (this.isCompleted && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

export default mongoose.model("GameSession", gameSessionSchema);
