const { query, execute, transaction } = require('../config/db');
const { getApplicableTestsForInstrument } = require('../rule-engine/applicabilityEngine');
const { logAudit } = require('../middleware/audit');

// List Test Projects
async function listProjects(req, res, next) {
  try {
    const { status, instrument_id, search } = req.query;
    let sql = `
      SELECT tp.*,
             i.name as instrument_name, i.model_number, i.serial_number, i.accuracy_class, i.max_capacity, i.unit,
             m.manufacturer_name,
             l.lab_name,
             rv.version_code as rule_version,
             u.full_name as officer_name,
             r.full_name as reviewer_name,
             (SELECT COUNT(*) FROM test_instances WHERE project_id = tp.id) as total_tests,
             (SELECT COUNT(*) FROM test_instances WHERE project_id = tp.id AND status = 'COMPLETED') as completed_tests
      FROM test_projects tp
      JOIN instruments i ON tp.instrument_id = i.id
      JOIN manufacturers m ON i.manufacturer_id = m.id
      JOIN laboratories l ON tp.laboratory_id = l.id
      JOIN rule_versions rv ON tp.rule_version_id = rv.id
      LEFT JOIN users u ON tp.assigned_officer_id = u.id
      LEFT JOIN users r ON tp.reviewer_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ` AND tp.status = ?`;
      params.push(status);
    }
    if (instrument_id) {
      sql += ` AND tp.instrument_id = ?`;
      params.push(instrument_id);
    }
    if (search) {
      sql += ` AND (tp.project_uid LIKE ? OR i.serial_number LIKE ? OR i.model_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY tp.id DESC`;
    const rows = await query(sql, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

// Get Single Test Project Details
async function getProjectById(req, res, next) {
  try {
    const { id } = req.params;

    const projects = await query(
      `SELECT tp.*,
              i.name as instrument_name, i.model_number, i.serial_number, i.accuracy_class,
              i.max_capacity, i.min_capacity, i.verification_scale_interval_e, i.actual_scale_interval_d,
              i.number_of_intervals_n, i.unit, i.tare_type, i.software_version,
              m.manufacturer_name, m.address as manufacturer_address,
              l.lab_name, l.lab_code,
              rv.version_code as rule_version, rv.changelog as rule_changelog,
              u.full_name as officer_name, u.email as officer_email,
              r.full_name as reviewer_name,
              a.full_name as approver_name
       FROM test_projects tp
       JOIN instruments i ON tp.instrument_id = i.id
       JOIN manufacturers m ON i.manufacturer_id = m.id
       JOIN laboratories l ON tp.laboratory_id = l.id
       JOIN rule_versions rv ON tp.rule_version_id = rv.id
       LEFT JOIN users u ON tp.assigned_officer_id = u.id
       LEFT JOIN users r ON tp.reviewer_id = r.id
       LEFT JOIN users a ON tp.approver_id = a.id
       WHERE tp.id = ?`,
      [id]
    );

    if (!projects || projects.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Test project not found' }
      });
    }

    const project = projects[0];

    // Linked Test Instances
    const testInstances = await query(
      `SELECT ti.*,
              td.test_code, td.clause_reference, td.test_name, td.category, td.sequence_order, td.is_mandatory,
              td.description as test_description,
              (SELECT COUNT(*) FROM measurement_sets ms JOIN observations o ON o.measurement_set_id = ms.id WHERE ms.test_instance_id = ti.id) as observation_count
       FROM test_instances ti
       JOIN test_definitions td ON ti.test_definition_id = td.id
       WHERE ti.project_id = ?
       ORDER BY td.sequence_order ASC`,
      [id]
    );

    // Linked Equipment
    const equipment = await query(
      `SELECT te.* 
       FROM test_project_equipment tpe
       JOIN test_equipment te ON tpe.equipment_id = te.id
       WHERE tpe.project_id = ?`,
      [id]
    );

    // Review history
    const reviews = await query(
      `SELECT r.*, u.full_name as reviewer_name, u.role as reviewer_role
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.project_id = ?
       ORDER BY r.created_at DESC`,
      [id]
    );

    // Final Report if generated
    const reports = await query(
      `SELECT * FROM reports WHERE project_id = ? ORDER BY id DESC LIMIT 1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        project,
        test_instances: testInstances,
        equipment,
        reviews,
        report: reports.length > 0 ? reports[0] : null
      }
    });
  } catch (error) {
    next(error);
  }
}

// Create New Test Project (Automated Test Planning according to OIML Rule Version)
async function createProject(req, res, next) {
  try {
    const {
      instrument_id,
      laboratory_id = 1,
      rule_version_id = 1,
      assigned_officer_id,
      reviewer_id = 3,
      approver_id = 4,
      start_date,
      expected_completion_date,
      environmental_conditions,
      equipment_ids = [1, 2, 3],
      notes
    } = req.body;

    if (!instrument_id) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Instrument ID is required' }
      });
    }

    const [instrument] = await query('SELECT * FROM instruments WHERE id = ?', [instrument_id]);
    if (!instrument) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Specified instrument does not exist' }
      });
    }

    // Determine Applicable Tests dynamically via Rule Engine
    const applicableTests = await getApplicableTestsForInstrument({
      instrument,
      ruleVersionId: rule_version_id
    });

    const projectUid = `PRJ-${new Date().getFullYear()}-DOCA-${Date.now().toString().slice(-4)}`;

    const projectId = await transaction(async (conn) => {
      // 1. Insert Test Project
      const [projRes] = await conn.execute(
        `INSERT INTO test_projects 
         (project_uid, instrument_id, laboratory_id, rule_version_id, assigned_officer_id, reviewer_id, approver_id,
          start_date, expected_completion_date, status, overall_compliance, environmental_conditions, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'IN_PROGRESS', 'PENDING', ?, ?, ?)`,
        [
          projectUid,
          instrument_id,
          laboratory_id,
          rule_version_id,
          assigned_officer_id || req.user.id,
          reviewer_id,
          approver_id,
          start_date || new Date().toISOString().split('T')[0],
          expected_completion_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          environmental_conditions ? JSON.stringify(environmental_conditions) : JSON.stringify({
            temperature_celsius: 22.0,
            relative_humidity_percent: 50.0,
            atmospheric_pressure_hpa: 1013.25,
            location: 'RRSL Metrology Testing Hall'
          }),
          notes || 'Standard OIML R-76 Type Evaluation Plan',
          req.user.id
        ]
      );

      const pid = projRes.insertId;

      // 2. Link Selected Equipment
      if (equipment_ids && equipment_ids.length > 0) {
        for (const eqId of equipment_ids) {
          await conn.execute(
            `INSERT INTO test_project_equipment (project_id, equipment_id) VALUES (?, ?)`,
            [pid, eqId]
          );
        }
      }

      // 3. Instantiate Applicable Test Instances automatically
      for (const test of applicableTests) {
        if (test.is_applicable) {
          await conn.execute(
            `INSERT INTO test_instances 
             (project_id, test_definition_id, status, compliance_result, compliance_summary)
             VALUES (?, ?, 'PENDING', 'NOT_EVALUATED', ?)`,
            [pid, test.test_definition_id, test.applicability_reason]
          );
        }
      }

      // 4. Update instrument status
      await conn.execute(`UPDATE instruments SET status = 'UNDER_TEST' WHERE id = ?`, [instrument_id]);

      return pid;
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_TEST_PROJECT',
      entity: 'TEST_PROJECT',
      entityId: projectId,
      afterState: { project_uid: projectUid, instrument_id },
      req
    });

    res.status(201).json({
      success: true,
      data: {
        id: projectId,
        project_uid: projectUid,
        applicable_tests_count: applicableTests.filter(t => t.is_applicable).length,
        message: 'Test Project created and applicable tests automatically initialized'
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listProjects,
  getProjectById,
  createProject
};
