import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon: { type: String, trim: true }, // icon name or URL
    category: {
      type: String,
      enum: ["score", "streak", "accuracy", "games", "category"],
      required: true,
    },
    threshold: { type: Number, required: true, min: 0 },
    points: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
  },
  { timestamps: true }
);

// Indexes
achievementSchema.index({ code: 1 });
achievementSchema.index({ category: 1 });
achievementSchema.index({ isActive: 1 });
achievementSchema.index({ category: 1, threshold: 1 });

export default mongoose.model("Achievement", achievementSchema);
