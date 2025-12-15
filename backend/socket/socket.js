const Message = require("../models/message");
module.exports = function (io) {
    const onlineUser = new Map();

    io.on("connection", (socket) => {
        console.log("New socket connected:", socket.id);
        
        socket.on("addUser", (UserId) => {
            onlineUsers.set(userId, socket.id);
        
            io.emit("onlineUsers", Array.from(onlineUser.keys()));
        });

        socket.on("sendMessage", async (data) => {
            const { senderId, reciverId, text } = data;


            try {
                const newMessage = await Message.create({
                    sender: senderId,
                    reciver: reciverId,
                    text: text,
                });
                const receiverSocketId = onlineUsers.get(receiverId);

                // Send message in real-time if receiver is online
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("getMessage", message);
                }
            } catch (error) {
                console.error(" Message send error:", error);
            }
        
        });
     socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);

      // Remove disconnected user
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
        }
      }

      // Send updated online users list
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });
  });
};

