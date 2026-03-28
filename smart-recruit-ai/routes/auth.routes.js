const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport"); 
const User = require("../models/user.model.js");
const authMiddleware = require("../middleware/auth.middleware.js"); 

const router = express.Router();



router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });

    res.json(user);
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } 
    );

    res.json({ 
      token, 
      role: user.role, 
      name: user.name 
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});



router.get("/google", (req, res, next) => {
  const role = req.query.role || "candidate"; 
  const state = Buffer.from(JSON.stringify({ role })).toString("base64");
  
  passport.authenticate("google", { 
    scope: ["profile", "email"], 
    state: state // 
  })(req, res, next);
});


router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    
    if (err) {
      return res.redirect(`${process.env.FRONTEND_URL}/signup?error=server_error`);
    }
    
    
    if (!user) {
      const errorType = info && info.message === 'role_mismatch' ? 'role_mismatch' : 'auth_failed';
      return res.redirect(`${process.env.FRONTEND_URL}/signup?error=${errorType}`);
    }

    
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.redirect(`${process.env.FRONTEND_URL}/signup?token=${token}&role=${user.role}`);
  })(req, res, next);
});



router.get("/linkedin", (req, res, next) => {
  const role = req.query.role || "candidate";
  const state = Buffer.from(JSON.stringify({ role })).toString("base64");

  passport.authenticate("linkedin", { state: state })(req, res, next);
});


router.get("/linkedin/callback", (req, res, next) => {
  passport.authenticate("linkedin", { session: false }, (err, user, info) => {
    if (err) {
      return res.redirect(`${process.env.FRONTEND_URL}/signup?error=server_error`);
    }
    
    if (!user) {
      const errorType = info && info.message === 'role_mismatch' ? 'role_mismatch' : 'auth_failed';
      return res.redirect(`${process.env.FRONTEND_URL}/signup?error=${errorType}`);
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.redirect(`${process.env.FRONTEND_URL}/signup?token=${token}&role=${user.role}`);
  })(req, res, next);
});

module.exports = router;