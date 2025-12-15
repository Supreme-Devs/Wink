const express = require("express");
const router = express.Router();
const Message = require("../models/message");
const mongoose = require("mongoose");
const auth = require("../middleware/auth"); // JWT auth middleware

// GET inbox for logged-in user
router.get("/inbox", auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const inbox = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"]
          },
          latestMessage: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            chatUser: "$_id",
            message: "$latestMessage"
          }
        }
      },
      { $sort: { "message.createdAt": -1 } }
    ]);

    res.json(inbox);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST send a message
router.post("/", auth, async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    if (!receiverId || !text)
      return res.status(400).json({ msg: "All fields are required" });

    const message = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      text,
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/chat/:chatUserId", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const chatUserId = req.params.chatUserId;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: chatUserId },
        { sender: chatUserId, receiver: userId },
      ]
    }).sort({ createdAt: 1 }); // oldest first

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
