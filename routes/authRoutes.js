import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with default role ('user')
 * @access  Public
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.',
        code: 'MISSING_FIELDS'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
        code: 'WEAK_PASSWORD'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email address is already registered.',
        code: 'EMAIL_EXISTS'
      });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'user' // Default role for standard registration
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully with default "user" role.',
      user: {
        id: newUser.id || newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/register-admin
 * @desc    Bootstrap/register an admin account with security key
 * @access  Public (Protected by ADMIN_REGISTRATION_KEY)
 */
router.post('/register-admin', async (req, res, next) => {
  try {
    const { name, email, password, adminKey } = req.body;
    const requiredKey = process.env.ADMIN_REGISTRATION_KEY || 'admin_secret_key_2026';

    if (!adminKey || adminKey !== requiredKey) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing admin registration key.',
        code: 'INVALID_ADMIN_KEY'
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email address is already registered.'
      });
    }

    const newAdmin = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'admin'
    });

    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully.',
      user: {
        id: newAdmin.id || newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and issue signed JWT containing user role
 * @access  Public
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Embed role into the JWT payload
    const payload = {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_week6_task3_rbac_2026';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    const token = jwt.sign(payload, secret, { expiresIn });

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile and active role
 * @access  Private (Authenticated users only)
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
