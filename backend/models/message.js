const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    // Optional: track if message is read
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // adds createdAt and updatedAt
);

module.exports = mongoose.model("Message", MessageSchema);
