// src/controllers/authController.js
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// POST /api/auth/signup
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const user = await User.create({ name, email, password, status: 'online' });

    const token = generateToken(user._id);

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        avatar: user.avatar,
      },
      token,
    });
  } catch (err) {
    console.error('registerUser error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    console.log('login successful for user:', user.email);
    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        avatar: user.avatar,
      },
      token,
    });
  } catch (err) {
    console.error('loginUser error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
