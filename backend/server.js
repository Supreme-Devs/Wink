require("dotenv").config();
const connectDB = require("./config/database");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages"); // your messages route
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);       // Signup/Login
app.use("/api/messages", messageRoutes); // Inbox & send messages
app.use("/api/users", require("./routes/users"));

// MongoDB
connectDB();

// Server + Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Track online users by userId
let onlineUsers = {};

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Auth error"));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error("Auth error"));
  }
});

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.userId);
  onlineUsers[socket.userId] = socket.id;

  io.emit("onlineUsers", onlineUsers);

  // Handle sending messages
  socket.on("sendMessage", async (data) => {
    // data = { receiverId, text }
    const Message = require("./models/message");
    const message = await Message.create({
      sender: socket.userId,
      receiver: data.receiverId,
      text: data.text,
    });

    // Send to receiver if online
    const receiverSocket = onlineUsers[data.receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", message);
    }

    // Send to sender too
    socket.emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.userId);
    delete onlineUsers[socket.userId];
    io.emit("onlineUsers", onlineUsers);
  });
});

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
