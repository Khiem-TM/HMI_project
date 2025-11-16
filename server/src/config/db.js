import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("Đường dẫn không hợp lệ --> Check lại trong .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("DONE");
    console.log(`DB: ${mongoose.connection.db.databaseName}`);
  } catch (error) {
    console.error(error.message);
    throw error; // reThrow
  }
};

export default connectDB;
