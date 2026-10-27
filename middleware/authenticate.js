import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Authentication Middleware:
 * Verifies JWT token supplied in Authorization header as Bearer token.
 * Populates req.user with decoded payload { id, name, email, role }.
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a Bearer token in the Authorization header.',
        code: 'TOKEN_MISSING'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is empty.',
        code: 'TOKEN_EMPTY'
      });
    }

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_week6_task3_rbac_2026';
    const decoded = jwt.verify(token, secret);

    req.user = {
      id: decoded.id || decoded._id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role || 'user'
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
      code: 'TOKEN_INVALID'
    });
  }
};
