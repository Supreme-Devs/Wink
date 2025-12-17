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

const JWT_SECRET = process.env.JWT_SECRET 

const app = express();

// Enable CORS for frontend
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Parse JSON requests
app.use(express.json());

// 🔥 LOG ALL INCOMING REQUESTS (UNCHANGED)
app.use((req, res, next) => {
  console.log(`🔥 Incoming request: ${req.method} ${req.url}`);
  console.log("Body:", req.body);
  next();
});

// Connect to MongoDB
connectDB();

// Routes (UNCHANGED)
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// ================= SOCKET.IO SETUP =================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    console.log("❌ Socket auth failed: no token");
    return next(new Error("Auth error"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id; // ✅ REAL USER ID
    next();
  } catch (err) {
    console.log("❌ Socket auth failed: invalid token");
    next(new Error("Auth error"));
  }
});


io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    console.log("❌ Socket auth failed: no token");
    return next(new Error("Auth error"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id; // ✅ REAL USER ID
    next();
  } catch (err) {
    console.log("❌ Socket auth failed: invalid token");
    next(new Error("Auth error"));
  }
});



// ✅ CONNECT SINGLE SOCKET HANDLER
require("./socket/socket")(io);
// ===================================================
app.get("/", (req, res) => res.send("Backend is running!"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
