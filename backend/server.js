require("dotenv").config();
const connectDB = require("./config/database");

connectDB();
const authRoutes = require("./routes/auth"); 
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
let onlineUsers = {};


const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", authRoutes); 


const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("join", (username) => {
    onlineUsers[socket.id] = username;
    console.log("🟢 Online Users:", onlineUsers);

    io.emit("onlineUsers", onlineUsers);
  });

  socket.on("chatMessage", (data) => {
    // data = { username: "User1", message: "Hello" }
    io.emit("chatMessage", data); // Broadcast to all clients
  });


  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);

        delete onlineUsers[socket.id];
    io.emit("onlineUsers", onlineUsers);

  });
});

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});











