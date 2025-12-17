const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true, // automatically trims whitespace
    },
    email: {
      type: String,
      required: true,
      trim: true,      // removes whitespace
      lowercase: true, // converts to lowercase
      unique: true,    // unique constraint
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// ✅ Safe index creation to prevent duplicate key errors
userSchema.index({ email: 1 }, { unique: true, background: true });

module.exports = mongoose.model("User", userSchema);
