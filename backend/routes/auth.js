const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Signup
router.post("/signup", async (req, res) => {



  console.log("🔥 SIGNUP HIT");
  console.log("🔥 Incoming request:", req.method, req.originalUrl);
console.log("Body:", req.body);

  
  
  try {
    let { username, email, password } = req.body;

    // ✅ NORMALIZE INPUT (TRIM + LOWERCASE)
    username = username?.trim();
    email = email?.trim().toLowerCase();

    if (!username || !email || !password) {
      return res.status(400).json({ msg: "Please enter all fields" });
    }

    // ✅ Check for existing user after normalization
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).json({
      msg: "User created successfully",
      user,
      token,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email?.trim().toLowerCase();

    if (!email || !password)
      return res.status(400).json({ msg: "Please enter all fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });

    res.json({ msg: "Login successful", user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
