import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        // Password chỉ bắt buộc nếu KHÔNG có googleId
        password: {
            type: String,
            required: function() { return !this.googleId; },
            minlength: 6
        },
        googleId: { type: String, unique: true, sparse: true },
        authType: {
            type: String,
            enum: ["local", "google"],
            default: "local"
        },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        isActive: { type: Boolean, default: true },
        lastLoginAt: { type: Date },
        deletedAt: { type: Date },
    },
    { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ deletedAt: 1 });

export default mongoose.model("User", userSchema);