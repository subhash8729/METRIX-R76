const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, execute } = require('../config/db');
const { logAudit } = require('../middleware/audit');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email and password are required' }
      });
    }

    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_FAILED', message: 'Invalid email or password' }
      });
    }

    const user = users[0];
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: { code: 'USER_INACTIVE', message: 'Account is deactivated' }
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_FAILED', message: 'Invalid email or password' }
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name },
      process.env.JWT_SECRET || 'METRIX_R76_DOCA_SECRET_KEY_2026_LEGAL_METROLOGY_COMPLIANCE',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      entity: 'USER',
      entityId: user.id,
      afterState: { email: user.email, role: user.role },
      req
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          department: user.department,
          designation: user.designation,
          phone: user.phone
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const users = await query(
      'SELECT id, full_name, email, role, department, designation, phone, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    res.json({ success: true, data: users[0] });
  } catch (error) {
    next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    const users = await query(
      'SELECT id, full_name, email, role, department, designation, phone, is_active, created_at FROM users ORDER BY id ASC'
    );
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Current and new password are required' }
      });
    }

    const users = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!users || !bcrypt.compareSync(currentPassword, users[0].password_hash)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' }
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);
    await execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    await logAudit({
      userId: req.user.id,
      action: 'CHANGE_PASSWORD',
      entity: 'USER',
      entityId: req.user.id,
      req
    });

    res.json({ success: true, message: 'Password successfully updated' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  getProfile,
  listUsers,
  changePassword
};
