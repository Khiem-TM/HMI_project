import mongoose from "mongoose";

const translationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  inputText: { type: String },
  outputSign: { type: String },
      direction: {
        type: String,
        enum: ["text-to-sign", "sign-to-text", "dictionary-lookup"]
      },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Translation", translationSchema);
