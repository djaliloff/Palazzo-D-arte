import { logger } from '../utils/logger.js';

/**
 * Middleware to check user role
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.id} with role ${req.user.role}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Middleware to check if user is admin or gestionnaire
 */
export const requireStaff = requireRole('ADMIN', 'GESTIONNAIRE');

