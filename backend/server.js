require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const connectDB = require("./config/database");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const userRoutes = require("./routes/users");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// Create HTTP server + Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Track online users
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
  console.log("User connected:", socket.userId);
  onlineUsers[socket.userId] = socket.id;
  io.emit("onlineUsers", onlineUsers);

  // Handle sending messages
  socket.on("chatMessage", async (data) => {
    const Message = require("./models/message");
    const message = await Message.create({
      sender: socket.userId,
      receiver: data.receiverId,
      text: data.text,
    });

    // Send message to receiver if online
    const receiverSocket = onlineUsers[data.receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("chatMessage", message);
    }

    // Send message to sender as well
    socket.emit("chatMessage", message);
  });

  socket.on("disconnect", () => {
    delete onlineUsers[socket.userId];
    io.emit("onlineUsers", onlineUsers);
  });
});

app.get("/", (req, res) => res.send("Backend is running!"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
