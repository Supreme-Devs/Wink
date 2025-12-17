const express = require("express");
const router = express.Router();
const Message = require("../models/message");
const User = require("../models/User"); // ✅ Added to fetch usernames
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

    // ✅ Populate chatUser with username
    const inboxWithNames = await Promise.all(
      inbox.map(async (item) => {
        const user = await User.findById(item.chatUser);
        return {
          ...item,
          chatUserName: user ? user.username : "Unknown",
        };
      })
    );

    res.json(inboxWithNames);
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

    // ✅ Add senderName and receiverName
    const messagesWithNames = await Promise.all(
      messages.map(async (msg) => {
        const sender = await User.findById(msg.sender);
        const receiver = await User.findById(msg.receiver);
        return {
          ...msg.toObject(),
          senderName: sender ? sender.username : "Unknown",
          receiverName: receiver ? receiver.username : "Unknown",
        };
      })
    );

    res.json(messagesWithNames);
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

    // ✅ Add senderName and receiverName in response
    const sender = await User.findById(message.sender);
    const receiver = await User.findById(message.receiver);

    res.status(201).json({
      ...message.toObject(),
      senderName: sender ? sender.username : "Unknown",
      receiverName: receiver ? receiver.username : "Unknown",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
