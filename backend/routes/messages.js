const express = require("express");
const router = express.Router();
const Message = require("../models/message");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");

// GET inbox
router.get("/inbox", auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const inbox = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
          },
          message: { $first: "$$ROOT" },
        },
      },
      {
        $project: {
          chatUser: "$_id",
          message: 1,
          _id: 0,
        },
      },
      { $sort: { "message.createdAt": -1 } },
    ]);

    res.json(inbox);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET chat messages
router.get("/chat/:userId", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SEND message
router.post("/", auth, async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    if (!receiverId || !text)
      return res.status(400).json({ msg: "All fields required" });

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

module.exports = router;
