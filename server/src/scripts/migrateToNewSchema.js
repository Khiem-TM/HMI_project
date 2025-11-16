import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";
import GameSession from "../models/GameSession.js";
import seedAchievements from "./seedAchievements.js";

dotenv.config();

const migrateToNewSchema = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await seedAchievements();
    const users = await User.find({ deletedAt: { $exists: false } });
    let profilesCreated = 0;
    let profilesSkipped = 0;

    for (const user of users) {
      const existingProfile = await UserProfile.findOne({ userId: user._id });
      if (!existingProfile) {
        await UserProfile.create({
          userId: user._id,
          totalScore: 0,
          totalGamesPlayed: 0,
          totalCorrectAnswers: 0,
          totalWrongAnswers: 0,
          accuracyRate: 0,
          currentStreak: 0,
          longestStreak: 0,
          level: 1,
          rank: "bronze",
        });
        profilesCreated++;
        console.log(`Created profile for user: ${user.email}`);
      } else {
        profilesSkipped++;
        console.log(`Profile already exists for user: ${user.email}`);
      }
    }

    console.log(
      `Profiles created: ${profilesCreated}, skipped: ${profilesSkipped}`
    );

    const usersToUpdate = await User.find({
      $or: [
        { isActive: { $exists: false } },
        { lastLoginAt: { $exists: false } },
      ],
    });

    let usersUpdated = 0;
    for (const user of usersToUpdate) {
      const update = {};
      if (!user.isActive) {
        update.isActive = true;
      }

      if (Object.keys(update).length > 0) {
        await User.updateOne({ _id: user._id }, { $set: update });
        usersUpdated++;
      }
    }

    console.log(` Updated ${usersUpdated} users`);

    console.log(`Total users: ${users.length}`);
    console.log(`Profiles created: ${profilesCreated}`);
    console.log(`Profiles skipped: ${profilesSkipped}`);
    console.log(`Users updated: ${usersUpdated}`);
    // Done seed
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.includes("migrateToNewSchema")
) {
  migrateToNewSchema();
}

export default migrateToNewSchema;
