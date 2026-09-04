const { execute } = require('../config/db');

async function logAudit({ userId, action, entity, entityId, beforeState = null, afterState = null, req = null }) {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') : '127.0.0.1';
    const userAgent = req ? (req.headers['user-agent'] || 'Direct/API') : 'Direct/API';

    await execute(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, before_state, after_state, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        action,
        entity,
        String(entityId || ''),
        beforeState ? JSON.stringify(beforeState) : null,
        afterState ? JSON.stringify(afterState) : null,
        ipAddress,
        userAgent
      ]
    );
  } catch (error) {
    console.error('Failed to record audit log:', error.message);
  }
}

module.exports = {
  logAudit
};
