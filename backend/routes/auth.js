const express = require("express");
const bcrypt = require("bcryptjs");
 const User = require("../models/User");

const router = express.Router();

router.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ msg: "Please enter all fields" });
    }
     
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
    res.status(201).json({ msg: "User created successfully", user });
});
    
  module.exports = router;