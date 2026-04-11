const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const passport = require('passport');
const { generateToken } = require('../utils/jwt.service');

async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    // Validation checks
    if (!name || !email || !password || !role) {
      console.warn('Register validation failed:', { name: !!name, email: !!email, password: !!password, role: !!role });
      return res.status(400).json({ 
        message: 'All fields are required (name, email, password, role)' 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn('Invalid email format:', email);
      return res.status(400).json({ 
        message: 'Invalid email format' 
      });
    }

    // Password length check
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn('Email already registered:', email);
      return res.status(409).json({ 
        message: 'Email already registered. Please use a different email or login.' 
      });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({ name, email, password: hashed, role });
    console.log('User registered successfully:', user.email);
    
    res.status(201).json({ 
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Register Error:', {
      message: err.message,
      code: err.code,
      name: err.name,
      stack: err.stack
    });

    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ 
        message: `This ${field} is already registered. Please use a different ${field}.` 
      });
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation failed: ' + messages.join(', ') 
      });
    }

    res.status(500).json({ 
      message: 'Registration failed due to server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' 
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({ 
        message: 'Server configuration error' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.warn('Login attempt with non-existent email:', email);
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn('Login attempt with wrong password for:', email);
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    const token = generateToken(user);
    
    console.log('User logged in successfully:', user.email);
    res.json({ 
      message: 'Login successful',
      token, 
      role: user.role, 
      name: user.name,
      id: user._id 
    });
  } catch (err) {
    console.error('Login Error:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ 
      message: 'Login failed due to server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' 
    });
  }
}

async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }
    res.json(user);
  } catch (err) {
    console.error('GetMe Error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch user information',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' 
    });
  }
}



function googleAuth(req, res, next) {
  const role = req.query.role || 'candidate';
  const state = Buffer.from(JSON.stringify({ role })).toString('base64');
  passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
}

function googleCallback(req, res, next) {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Google OAuth Error:', err);
      return res.redirect(`${process.env.FRONTEND_URL || ''}/signup?error=server_error`);
    }

    if (!user) {
      const errorType = info && info.message === 'role_mismatch' ? 'role_mismatch' : 'auth_failed';
      return res.redirect(`${process.env.FRONTEND_URL || ''}/signup?error=${errorType}`);
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set for OAuth token generation');
      return res.redirect(`${process.env.FRONTEND_URL || ''}/signup?error=server_error`);
    }

    const token = generateToken(user);
    res.redirect(`${process.env.FRONTEND_URL || ''}/signup?token=${token}&role=${user.role}`);
  })(req, res, next);
}

function linkedinAuth(req, res, next) {
  const role = req.query.role || 'candidate';
  const state = Buffer.from(JSON.stringify({ role })).toString('base64');
  passport.authenticate('linkedin', { state })(req, res, next);
}

function linkedinCallback(req, res, next) {
  passport.authenticate('linkedin', { session: false }, (err, user, info) => {
    if (err) {
      console.error('LinkedIn OAuth Error:', err);
      return res.redirect(`${process.env.FRONTEND_URL || ''}/signup?error=server_error`);
    }

    if (!user) {
      const errorType = info && info.message === 'role_mismatch' ? 'role_mismatch' : 'auth_failed';
      return res.redirect(`${process.env.FRONTEND_URL || ''}/signup?error=${errorType}`);
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set for OAuth token generation');
      return res.redirect(`${process.env.FRONTEND_URL || ''}/signup?error=server_error`);
    }

    const token = generateToken(user);
    res.redirect(`${process.env.FRONTEND_URL || ''}/signup?token=${token}&role=${user.role}`);
  })(req, res, next);
}

module.exports = { register, login, getMe, googleAuth, googleCallback, linkedinAuth, linkedinCallback };
