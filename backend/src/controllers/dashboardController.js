const { query } = require('../config/db');

async function getDashboardMetrics(req, res, next) {
  try {
    // 1. Overall counts
    const [instRow] = await query('SELECT COUNT(*) as total FROM instruments');
    const [projRow] = await query('SELECT COUNT(*) as total FROM test_projects');
    const [reportsRow] = await query('SELECT COUNT(*) as total FROM reports');
    const [equipRow] = await query('SELECT COUNT(*) as total FROM test_equipment WHERE status = "CALIBRATED"');

    // 2. Project counts by status
    const statusRows = await query(
      `SELECT status, COUNT(*) as count 
       FROM test_projects 
       GROUP BY status`
    );
    const statusCounts = {
      DRAFT: 0,
      IN_PROGRESS: 0,
      TESTING_COMPLETED: 0,
      UNDER_REVIEW: 0,
      CHANGES_REQUESTED: 0,
      APPROVED: 0,
      REJECTED: 0,
      FINALIZED: 0
    };
    statusRows.forEach(r => {
      statusCounts[r.status] = r.count;
    });

    // 3. Overall Compliance Pass / Fail breakdown
    const complianceRows = await query(
      `SELECT overall_compliance, COUNT(*) as count 
       FROM test_projects 
       GROUP BY overall_compliance`
    );
    const complianceStats = { PASS: 0, FAIL: 0, WARNING: 0, PENDING: 0 };
    complianceRows.forEach(r => {
      complianceStats[r.overall_compliance] = r.count;
    });

    // 4. Recent test activities
    const recentProjects = await query(
      `SELECT tp.id, tp.project_uid, tp.status, tp.overall_compliance, tp.created_at,
              i.name as instrument_name, i.model_number, i.accuracy_class,
              m.manufacturer_name,
              u.full_name as officer_name
       FROM test_projects tp
       JOIN instruments i ON tp.instrument_id = i.id
       JOIN manufacturers m ON i.manufacturer_id = m.id
       LEFT JOIN users u ON tp.assigned_officer_id = u.id
       ORDER BY tp.updated_at DESC
       LIMIT 6`
    );

    // 5. Recent audit activity
    const recentAudits = await query(
      `SELECT a.id, a.action, a.entity, a.entity_id, a.created_at,
              u.full_name as user_name, u.role
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT 8`
    );

    // 6. Role-specific pending actions
    let pendingActions = [];
    if (req.user.role === 'LAB_OFFICER') {
      const pendingTests = await query(
        `SELECT tp.id, tp.project_uid, i.name as instrument_name, tp.status
         FROM test_projects tp
         JOIN instruments i ON tp.instrument_id = i.id
         WHERE tp.assigned_officer_id = ? AND tp.status IN ('DRAFT', 'IN_PROGRESS', 'CHANGES_REQUESTED')
         LIMIT 5`,
        [req.user.id]
      );
      pendingActions = pendingTests.map(p => ({
        id: p.id,
        title: `Continue Testing: ${p.project_uid}`,
        description: `${p.instrument_name} - Status: ${p.status}`,
        link: `/projects/${p.id}`,
        type: 'TEST'
      }));
    } else if (req.user.role === 'REVIEWER') {
      const awaitingReview = await query(
        `SELECT tp.id, tp.project_uid, i.name as instrument_name
         FROM test_projects tp
         JOIN instruments i ON tp.instrument_id = i.id
         WHERE tp.status = 'UNDER_REVIEW'
         LIMIT 5`
      );
      pendingActions = awaitingReview.map(p => ({
        id: p.id,
        title: `Review Requested: ${p.project_uid}`,
        description: `Inspect observations and calculations for ${p.instrument_name}`,
        link: `/projects/${p.id}/review`,
        type: 'REVIEW'
      }));
    } else if (req.user.role === 'APPROVER') {
      const awaitingApproval = await query(
        `SELECT tp.id, tp.project_uid, i.name as instrument_name
         FROM test_projects tp
         JOIN instruments i ON tp.instrument_id = i.id
         WHERE tp.status = 'APPROVED'
         LIMIT 5`
      );
      pendingActions = awaitingApproval.map(p => ({
        id: p.id,
        title: `Final Authorization Needed: ${p.project_uid}`,
        description: `Ready to finalize and lock report for ${p.instrument_name}`,
        link: `/projects/${p.id}/review`,
        type: 'APPROVE'
      }));
    }

    res.json({
      success: true,
      data: {
        summary: {
          total_instruments: instRow.total,
          total_projects: projRow.total,
          total_reports: reportsRow.total,
          calibrated_equipment: equipRow.total,
          awaiting_review: statusCounts.UNDER_REVIEW,
          approved_reports: statusCounts.APPROVED + statusCounts.FINALIZED,
          rejected_reports: statusCounts.REJECTED
        },
        status_counts: statusCounts,
        compliance_stats: complianceStats,
        recent_projects: recentProjects,
        recent_audits: recentAudits,
        pending_actions: pendingActions
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardMetrics
};
