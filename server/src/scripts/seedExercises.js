import mongoose from "mongoose";
import dotenv from "dotenv";
import Exercise from "../models/Exercise.js"; // Đảm bảo đường dẫn đúng tới model
import { exercisesData } from "../data/exercisesData.js";

// Load biến môi trường để lấy MONGO_URI
dotenv.config();
// Nếu file .env nằm ở root server, có thể cần: dotenv.config({ path: '../../.env' });

const seedExercises = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected!");

        // KHÔNG DÙNG deleteMany NỮA
        // await Exercise.deleteMany({});

        console.log(`🚀 Updating/Inserting exercises...`);

        let count = 0;
        for (const exercise of exercisesData) {
            // Tìm theo từ vựng (word)
            // Nếu tìm thấy -> Update nội dung
            // Nếu không thấy -> Tạo mới (upsert: true)
            await Exercise.findOneAndUpdate(
                { word: exercise.word },
                exercise,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            count++;
        }

        console.log(`🎉 Processed ${count} exercises successfully!`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedExercises();