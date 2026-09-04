const { query } = require('../config/db');

// List Audit Logs
async function listAuditLogs(req, res, next) {
  try {
    const { entity, action, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT a.*, u.full_name as user_name, u.email as user_email, u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (entity) {
      sql += ` AND a.entity = ?`;
      params.push(entity);
    }
    if (action) {
      sql += ` AND a.action = ?`;
      params.push(action);
    }

    sql += ` ORDER BY a.id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const rows = await query(sql, params);
    const [countRow] = await query('SELECT COUNT(*) as total FROM audit_logs');

    res.json({
      success: true,
      data: {
        logs: rows.map(r => ({
          ...r,
          before_state: typeof r.before_state === 'string' ? JSON.parse(r.before_state) : r.before_state,
          after_state: typeof r.after_state === 'string' ? JSON.parse(r.after_state) : r.after_state
        })),
        total: countRow.total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listAuditLogs
};
