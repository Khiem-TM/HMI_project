import mongoose from "mongoose";
import dotenv from "dotenv";
import Achievement from "../models/Achievement.js";

dotenv.config();

const achievements = [
  {
    code: "SCORE_100",
    name: "First Steps",
    description: "Reach 100 total score",
    icon: "trophy",
    category: "score",
    threshold: 100,
    points: 10,
    difficulty: "easy",
  },
  {
    code: "SCORE_500",
    name: "Getting Started",
    description: "Reach 500 total score",
    icon: "star",
    category: "score",
    threshold: 500,
    points: 25,
    difficulty: "easy",
  },
  {
    code: "SCORE_1000",
    name: "Rising Star",
    description: "Reach 1,000 total score",
    icon: "award",
    category: "score",
    threshold: 1000,
    points: 50,
    difficulty: "medium",
  },
  {
    code: "SCORE_5000",
    name: "Expert Player",
    description: "Reach 5,000 total score",
    icon: "medal",
    category: "score",
    threshold: 5000,
    points: 100,
    difficulty: "hard",
  },
  {
    code: "SCORE_10000",
    name: "Master",
    description: "Reach 10,000 total score",
    icon: "crown",
    category: "score",
    threshold: 10000,
    points: 200,
    difficulty: "hard",
  },

  {
    code: "STREAK_3",
    name: "Three Day Streak",
    description: "Play for 3 consecutive days",
    icon: "flame",
    category: "streak",
    threshold: 3,
    points: 15,
    difficulty: "easy",
  },
  {
    code: "STREAK_7",
    name: "Week Warrior",
    description: "Play for 7 consecutive days",
    icon: "fire",
    category: "streak",
    threshold: 7,
    points: 30,
    difficulty: "medium",
  },
  {
    code: "STREAK_14",
    name: "Two Week Champion",
    description: "Play for 14 consecutive days",
    icon: "zap",
    category: "streak",
    threshold: 14,
    points: 50,
    difficulty: "medium",
  },
  {
    code: "STREAK_30",
    name: "Monthly Master",
    description: "Play for 30 consecutive days",
    icon: "lightning",
    category: "streak",
    threshold: 30,
    points: 100,
    difficulty: "hard",
  },

  {
    code: "ACCURACY_70",
    name: "Good Accuracy",
    description: "Achieve 70% accuracy rate",
    icon: "target",
    category: "accuracy",
    threshold: 70,
    points: 20,
    difficulty: "easy",
  },
  {
    code: "ACCURACY_80",
    name: "Great Accuracy",
    description: "Achieve 80% accuracy rate",
    icon: "bullseye",
    category: "accuracy",
    threshold: 80,
    points: 40,
    difficulty: "medium",
  },
  {
    code: "ACCURACY_90",
    name: "Excellent Accuracy",
    description: "Achieve 90% accuracy rate",
    icon: "dart",
    category: "accuracy",
    threshold: 90,
    points: 75,
    difficulty: "hard",
  },
  {
    code: "ACCURACY_95",
    name: "Perfect Accuracy",
    description: "Achieve 95% accuracy rate",
    icon: "perfect",
    category: "accuracy",
    threshold: 95,
    points: 150,
    difficulty: "hard",
  },

  {
    code: "GAMES_10",
    name: "Getting the Hang of It",
    description: "Complete 10 games",
    icon: "play",
    category: "games",
    threshold: 10,
    points: 15,
    difficulty: "easy",
  },
  {
    code: "GAMES_50",
    name: "Dedicated Learner",
    description: "Complete 50 games",
    icon: "gamepad",
    category: "games",
    threshold: 50,
    points: 50,
    difficulty: "medium",
  },
  {
    code: "GAMES_100",
    name: "Century Club",
    description: "Complete 100 games",
    icon: "controller",
    category: "games",
    threshold: 100,
    points: 100,
    difficulty: "hard",
  },
  {
    code: "GAMES_500",
    name: "Ultimate Gamer",
    description: "Complete 500 games",
    icon: "trophy-cup",
    category: "games",
    threshold: 500,
    points: 250,
    difficulty: "hard",
  },
];

const seedAchievements = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const achievement of achievements) {
      const existing = await Achievement.findOne({ code: achievement.code });
      if (existing) {
        // Update if exists
        await Achievement.updateOne({ code: achievement.code }, achievement);
        updated++;
        console.log(`Updated: ${achievement.code} - ${achievement.name}`);
      } else {
        await Achievement.create(achievement);
        created++;
        console.log(`Created: ${achievement.code} - ${achievement.name}`);
      }
    }

    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding achievements:", error);
    process.exit(1);
  }
};

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.includes("seedAchievements")
) {
  seedAchievements();
}

export default seedAchievements;
