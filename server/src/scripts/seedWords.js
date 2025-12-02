import mongoose from "mongoose";
import dotenv from "dotenv";
import Word from "../models/Word.js";
import { exercisesData } from "../data/exercisesData.js";

dotenv.config();

const seedWords = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected!");

        console.log(`🚀 Updating/Inserting words...`);

        let count = 0;
        for (const item of exercisesData) {
            const wordData = {
                word: item.word,
                meaning: item.wordMeaning,
                category: item.category,
                videoUrl: item.videoUrl,
                thumbnail: item.thumbnail,
                difficulty: item.difficulty,
                description: `Learn how to sign "${item.word}" in ASL.`
            };

            await Word.findOneAndUpdate(
                { word: item.word },
                wordData,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            count++;
        }

        console.log(`🎉 Processed ${count} words successfully!`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedWords();
