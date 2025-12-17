console.log("🔥 backend/socket/socket.js LOADED");


const Message = require("../models/message");
const User = require("../models/User");

module.exports = function (io) {
  const onlineUsers = new Map();

  io.on("connection", async (socket) => {
    console.log("🔌 Socket connected:", socket.userId);

    onlineUsers.set(socket.userId, socket.id);

 
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));

    const users = await User.find().select("_id username");
    console.log("📤 Sending allUsers:", users.length);
    socket.emit("allUsers", users);

    const messages = await Message.find({
      $or: [
        { sender: socket.userId },
        { receiver: socket.userId },
      ],
    }).sort({ createdAt: 1 });

    socket.emit("chatHistory", messages);

    // ✅ SEND MESSAGE
    socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
      if (!senderId || !receiverId || !text) return;

      const newMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        text,
      });

      // send to sender
      socket.emit("chatMessage", newMessage);

      // send to receiver if online
      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit("chatMessage", newMessage);
      }
    });

    // ✅ DISCONNECT
    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.userId);
      onlineUsers.delete(socket.userId);
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });
  });
};
