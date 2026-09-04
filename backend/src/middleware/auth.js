const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// Authenticate JWT Token
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) || req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is missing'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'METRIX_R76_DOCA_SECRET_KEY_2026_LEGAL_METROLOGY_COMPLIANCE');
    
    // Check if user is still active in DB
    const users = await query('SELECT id, full_name, email, role, department, is_active FROM users WHERE id = ?', [decoded.id]);
    if (!users || users.length === 0 || !users[0].is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is deactivated or not found'
        }
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid or expired authentication token'
      }
    });
  }
}

// Authorize roles
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: `Forbidden: Role '${req.user.role}' is not authorized for this action. Allowed: ${allowedRoles.join(', ')}`
        }
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
