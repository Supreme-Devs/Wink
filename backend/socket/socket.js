const Message = require("../models/message");

module.exports = function (io) {
  const onlineUsers = new Map(); // ✅ FIXED name

  io.on("connection", (socket) => {
    console.log("🔌 New socket connected:", socket.id);

    // ✅ ADD USER
    socket.on("addUser", (userId) => {
      if (!userId) return;

      onlineUsers.set(userId, socket.id);
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });

    // ✅ SEND MESSAGE
    socket.on("sendMessage", async (data) => {
      const { senderId, receiverId, text } = data;

      if (!senderId || !receiverId || !text) return;

      try {
        const newMessage = await Message.create({
          sender: senderId,
          receiver: receiverId,
          text,
        });

        const receiverSocketId = onlineUsers.get(receiverId);

        // Send to receiver if online
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("chatMessage", newMessage);
        }

        // Send back to sender
        socket.emit("chatMessage", newMessage);
      } catch (error) {
        console.error("❌ Message send error:", error);
      }
    });

    // ✅ DISCONNECT
    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);

      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
        }
      }

      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });
  });
};
