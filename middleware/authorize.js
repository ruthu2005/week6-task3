/**
 * Role-Based Authorization Middleware
 * Verifies that the authenticated user possesses one of the required roles.
 *
 * @param  {...string} allowedRoles - List of authorized roles (e.g., 'admin', 'moderator')
 * @returns {Function} Express middleware function
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Check if user is authenticated (req.user must be populated by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No user context found.',
        code: 'AUTH_REQUIRED'
      });
    }

    // 2. Normalize allowed roles (if array passed as single argument or individual args)
    const normalizedRoles = allowedRoles.flat();

    // 3. Verify user's role against allowed roles
    if (!normalizedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to access this resource.',
        code: 'ACCESS_FORBIDDEN',
        requiredRoles: normalizedRoles,
        userRole: req.user.role
      });
    }

    // 4. Role verified successfully -> proceed to handler
    next();
  };
};

export default authorize;
