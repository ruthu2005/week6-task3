import express from 'express';
import os from 'os';
import User from '../models/User.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get administrative dashboard statistics and security status
 * @access  Private (Admin role only)
 */
router.get(
  '/dashboard',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const totalUsers = await User.countDocuments();
      const adminCount = await User.countDocuments({ role: 'admin' });
      const userCount = await User.countDocuments({ role: 'user' });

      return res.status(200).json({
        success: true,
        message: 'Welcome to the Secure Admin Dashboard. Access granted.',
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role
        },
        stats: {
          totalUsers,
          adminCount,
          userCount,
          systemStatus: 'operational',
          serverUptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/admin/users
 * @desc    List all registered users and their assigned roles
 * @access  Private (Admin role only)
 */
router.get(
  '/users',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const users = await User.find();
      const sanitizedUsers = (Array.isArray(users) ? users : []).map((u) => {
        return typeof u.toJSON === 'function'
          ? u.toJSON()
          : {
              id: u.id || u._id,
              name: u.name,
              email: u.email,
              role: u.role,
              createdAt: u.createdAt
            };
      });

      return res.status(200).json({
        success: true,
        count: sanitizedUsers.length,
        users: sanitizedUsers
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Promote or change a user's role
 * @access  Private (Admin role only)
 */
router.patch(
  '/users/:id/role',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified. Allowed values are "user" or "admin".',
          code: 'INVALID_ROLE'
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { role },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: `User with ID "${id}" was not found.`,
          code: 'USER_NOT_FOUND'
        });
      }

      return res.status(200).json({
        success: true,
        message: `User role updated successfully to "${role}".`,
        user: typeof updatedUser.toJSON === 'function' ? updatedUser.toJSON() : updatedUser
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user by ID
 * @access  Private (Admin role only)
 */
router.delete(
  '/users/:id',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Prevent admin self-deletion
      if (req.user.id === id) {
        return res.status(400).json({
          success: false,
          message: 'Administrative safety constraint: You cannot delete your own account.',
          code: 'SELF_DELETION_PROHIBITED'
        });
      }

      const deleted = await User.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: `User with ID "${id}" was not found.`,
          code: 'USER_NOT_FOUND'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'User removed from system successfully.',
        deletedId: id
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/admin/system-stats
 * @desc    Detailed server & memory statistics
 * @access  Private (Admin role only)
 */
router.get(
  '/system-stats',
  authenticate,
  authorize('admin'),
  (req, res) => {
    res.status(200).json({
      success: true,
      system: {
        host: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        freeMemMB: Math.round(os.freemem() / 1024 / 1024),
        totalMemMB: Math.round(os.totalmem() / 1024 / 1024),
        processMemoryUsageMB: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
        }
      }
    });
  }
);

/**
 * @route   GET /api/admin/profile-check
 * @desc    General authenticated test endpoint (all authenticated roles can access)
 * @access  Private (Any authenticated user)
 */
router.get(
  '/profile-check',
  authenticate,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Authentication check passed. Your session token is valid.',
      user: req.user
    });
  }
);

export default router;
