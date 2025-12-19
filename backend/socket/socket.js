console.log("🔥 backend/socket/socket.js LOADED");

const Message = require("../models/message");
const User = require("../models/User");

module.exports = function (io) {
  const onlineUsers = new Map();

  io.on("connection", async (socket) => {
    console.log("🔌 Socket connected:", socket.userId);

    // store online user
    onlineUsers.set(socket.userId, socket.id);

    // send all users
    const users = await User.find().select("_id username");
    socket.emit("allUsers", users);

    // ================= CHAT =================
    socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
      if (!senderId || !receiverId || !text) return;

      const newMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        text,
      });

      socket.emit("chatMessage", newMessage);

      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit("chatMessage", newMessage);
      }
    });

    // ================= 📹 VIDEO CALL =================

    // CALL USER
    socket.on("callUser", ({ to, offer }) => {
      const receiverSocket = onlineUsers.get(to);

      console.log("📞 callUser:", {
        from: socket.userId,
        to,
        receiverSocket,
      });

      if (receiverSocket) {
        io.to(receiverSocket).emit("incomingCall", {
          from: socket.userId,
          offer,
        });
      }
    });

    // ANSWER CALL
    socket.on("answerCall", ({ to, answer }) => {
      const receiverSocket = onlineUsers.get(to);

      if (receiverSocket) {
        io.to(receiverSocket).emit("callAccepted", {
          answer,
        });
      }
    });

    // ICE CANDIDATE
    socket.on("iceCandidate", ({ to, candidate }) => {
      const receiverSocket = onlineUsers.get(to);

      if (receiverSocket) {
        io.to(receiverSocket).emit("iceCandidate", {
          candidate,
        });
      }
    });

    // ================= DISCONNECT =================
    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.userId);
      onlineUsers.delete(socket.userId);
    });
  });
};
