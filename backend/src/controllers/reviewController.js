const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { query, execute, transaction } = require('../config/db');
const { evaluateProjectCompliance } = require('../rule-engine/complianceEngine');
const { generatePDFReport } = require('../reports/pdfGenerator');
const { generateDOCXReport } = require('../reports/docxGenerator');
const { logAudit } = require('../middleware/audit');

// Submit Test Project for Review
async function submitForReview(req, res, next) {
  try {
    const { projectId } = req.params;

    // Check project status
    const [project] = await query('SELECT * FROM test_projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Test project not found' }
      });
    }

    if (project.status === 'FINALIZED') {
      return res.status(400).json({
        success: false,
        error: { code: 'LOCKED', message: 'Project is already finalized and locked' }
      });
    }

    // Validation: Verify all mandatory tests are completed
    const pendingMandatory = await query(
      `SELECT ti.id, td.test_name, td.clause_reference
       FROM test_instances ti
       JOIN test_definitions td ON ti.test_definition_id = td.id
       WHERE ti.project_id = ? AND td.is_mandatory = TRUE AND ti.status != 'COMPLETED'`,
      [projectId]
    );

    if (pendingMandatory.length > 0) {
      const list = pendingMandatory.map(m => `${m.test_name} (${m.clause_reference})`).join(', ');
      return res.status(400).json({
        success: false,
        error: {
          code: 'MANDATORY_TESTS_INCOMPLETE',
          message: `Cannot submit for review: Mandatory tests are still incomplete (${list})`
        }
      });
    }

    // Evaluate overall project compliance
    const complianceSummary = await evaluateProjectCompliance(projectId);

    await execute(
      `UPDATE test_projects 
       SET status = 'UNDER_REVIEW', overall_compliance = ?
       WHERE id = ?`,
      [complianceSummary.overall_compliance, projectId]
    );

    await logAudit({
      userId: req.user.id,
      action: 'SUBMIT_FOR_REVIEW',
      entity: 'TEST_PROJECT',
      entityId: projectId,
      afterState: { status: 'UNDER_REVIEW', overall_compliance: complianceSummary.overall_compliance },
      req
    });

    res.json({
      success: true,
      data: {
        project_id: projectId,
        status: 'UNDER_REVIEW',
        overall_compliance: complianceSummary.overall_compliance,
        message: 'Test Project submitted successfully for technical review'
      }
    });
  } catch (error) {
    next(error);
  }
}

// Reviewer Action: Technical Review
async function reviewProject(req, res, next) {
  try {
    const { projectId } = req.params;
    const { decision, comments } = req.body;

    if (!decision || !['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DECISION', message: 'Decision must be APPROVED, CHANGES_REQUESTED, or REJECTED' }
      });
    }

    const [project] = await query('SELECT * FROM test_projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Test project not found' }
      });
    }

    let nextStatus = 'UNDER_REVIEW';
    if (decision === 'APPROVED') nextStatus = 'APPROVED';
    else if (decision === 'CHANGES_REQUESTED') nextStatus = 'CHANGES_REQUESTED';
    else if (decision === 'REJECTED') nextStatus = 'REJECTED';

    await transaction(async (conn) => {
      // 1. Record Review
      await conn.execute(
        `INSERT INTO reviews (project_id, reviewer_id, review_type, decision, comments, signature_meta)
         VALUES (?, ?, 'TECHNICAL_REVIEW', ?, ?, ?)`,
        [
          projectId,
          req.user.id,
          decision,
          comments || `Technical review completed by ${req.user.full_name}`,
          JSON.stringify({
            reviewer_name: req.user.full_name,
            role: req.user.role,
            timestamp: new Date().toISOString()
          })
        ]
      );

      // 2. Update Project Status
      await conn.execute(
        `UPDATE test_projects 
         SET status = ?, reviewer_id = ? 
         WHERE id = ?`,
        [nextStatus, req.user.id, projectId]
      );
    });

    await logAudit({
      userId: req.user.id,
      action: `REVIEW_${decision}`,
      entity: 'TEST_PROJECT',
      entityId: projectId,
      afterState: { status: nextStatus, decision, comments },
      req
    });

    res.json({
      success: true,
      data: {
        project_id: projectId,
        status: nextStatus,
        decision,
        message: `Project status updated to ${nextStatus}`
      }
    });
  } catch (error) {
    next(error);
  }
}

// Approver Action: Final Approval, Locking, and Automated Standardized Report Generation
async function finalizeAndApprove(req, res, next) {
  try {
    const { projectId } = req.params;
    const { comments } = req.body;

    const [project] = await query(
      `SELECT tp.*, 
              i.name as instrument_name, i.model_number, i.serial_number, i.accuracy_class, i.max_capacity,
              i.min_capacity, i.verification_scale_interval_e, i.actual_scale_interval_d, i.number_of_intervals_n,
              i.unit, i.tare_type, i.software_version,
              m.manufacturer_name,
              l.lab_name, l.lab_code,
              rv.version_code as rule_version,
              rs.title as standard_title,
              uo.full_name as officer_name,
              ur.full_name as reviewer_name
       FROM test_projects tp
       JOIN instruments i ON tp.instrument_id = i.id
       JOIN manufacturers m ON i.manufacturer_id = m.id
       JOIN laboratories l ON tp.laboratory_id = l.id
       JOIN rule_versions rv ON tp.rule_version_id = rv.id
       JOIN rule_standards rs ON rv.standard_id = rs.id
       LEFT JOIN users uo ON tp.assigned_officer_id = uo.id
       LEFT JOIN users ur ON tp.reviewer_id = ur.id
       WHERE tp.id = ?`,
      [projectId]
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Test project not found' }
      });
    }

    if (project.status === 'FINALIZED') {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_FINALIZED', message: 'Test project is already finalized and locked' }
      });
    }

    // Fetch tests and observations for report compilation
    const tests = await query(
      `SELECT ti.id, ti.compliance_result, ti.compliance_summary,
              td.test_code, td.clause_reference, td.test_name
       FROM test_instances ti
       JOIN test_definitions td ON ti.test_definition_id = td.id
       WHERE ti.project_id = ?
       ORDER BY td.sequence_order ASC`,
      [projectId]
    );

    const detailedObservations = await query(
      `SELECT o.*, td.test_name, td.clause_reference, ms.set_name, ms.position
       FROM observations o
       JOIN measurement_sets ms ON o.measurement_set_id = ms.id
       JOIN test_instances ti ON ms.test_instance_id = ti.id
       JOIN test_definitions td ON ti.test_definition_id = td.id
       WHERE ti.project_id = ? AND o.is_latest = TRUE
       ORDER BY td.sequence_order ASC, o.id ASC`,
      [projectId]
    );

    const equipmentUsed = await query(
      `SELECT te.name, te.accuracy_class, te.certificate_number
       FROM test_project_equipment tpe
       JOIN test_equipment te ON tpe.equipment_id = te.id
       WHERE tpe.project_id = ?`,
      [projectId]
    );

    // Generate unique official Report Number
    const reportNumber = `DOCA-RRSL-${new Date().getFullYear()}-R76-${String(projectId).padStart(3, '0')}`;
    const reportDir = path.resolve(__dirname, '../../uploads/reports');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

    const pdfFileName = `${reportNumber}.pdf`;
    const docxFileName = `${reportNumber}.docx`;
    const pdfPath = path.join(reportDir, pdfFileName);
    const docxPath = path.join(reportDir, docxFileName);

    const reportData = {
      report_number: reportNumber,
      project_uid: project.project_uid,
      standard_title: project.standard_title,
      rule_version: project.rule_version,
      lab_name: project.lab_name,
      overall_compliance: project.overall_compliance,
      issue_date: new Date().toISOString(),
      officer_name: project.officer_name,
      reviewer_name: project.reviewer_name,
      approver_name: req.user.full_name,
      instrument: {
        name: project.instrument_name,
        model_number: project.model_number,
        serial_number: project.serial_number,
        manufacturer_name: project.manufacturer_name,
        accuracy_class: project.accuracy_class,
        max_capacity: project.max_capacity,
        min_capacity: project.min_capacity,
        verification_scale_interval_e: project.verification_scale_interval_e,
        actual_scale_interval_d: project.actual_scale_interval_d,
        number_of_intervals_n: project.number_of_intervals_n,
        unit: project.unit,
        tare_type: project.tare_type,
        software_version: project.software_version
      },
      environmental_conditions: typeof project.environmental_conditions === 'string'
        ? JSON.parse(project.environmental_conditions)
        : project.environmental_conditions,
      equipment_used: equipmentUsed,
      tests: tests.map(t => ({
        clause: t.clause_reference,
        name: t.test_name,
        compliance_result: t.compliance_result,
        permissible_summary: t.compliance_summary
      })),
      detailed_observations: detailedObservations
    };

    // 1. Generate PDF Report
    const pdfResult = await generatePDFReport(reportData, pdfPath);
    // 2. Generate DOCX Report
    await generateDOCXReport(reportData, docxPath);

    // Compute final hash
    const checksumHash = pdfResult.checksum;

    // Save report in database and lock project
    const reportId = await transaction(async (conn) => {
      // Record Approver review
      await conn.execute(
        `INSERT INTO reviews (project_id, reviewer_id, review_type, decision, comments, signature_meta)
         VALUES (?, ?, 'FINAL_APPROVAL', 'APPROVED', ?, ?)`,
        [
          projectId,
          req.user.id,
          comments || `Final type approval authorized by ${req.user.full_name}`,
          JSON.stringify({
            approver_name: req.user.full_name,
            role: req.user.role,
            timestamp: new Date().toISOString()
          })
        ]
      );

      // Finalize and Lock Project
      await conn.execute(
        `UPDATE test_projects 
         SET status = 'FINALIZED', approver_id = ?, actual_completion_date = CURDATE()
         WHERE id = ?`,
        [req.user.id, projectId]
      );

      // Create Report Record
      const [repRes] = await conn.execute(
        `INSERT INTO reports 
         (report_number, project_id, instrument_id, rule_version_id, report_version, status, checksum_hash,
          pdf_path, docx_path, generated_by, approved_by, finalized_at, metadata)
         VALUES (?, ?, ?, ?, 1, 'FINALIZED', ?, ?, ?, ?, ?, NOW(), ?)`,
        [
          reportNumber,
          projectId,
          project.instrument_id,
          project.rule_version_id,
          checksumHash,
          `uploads/reports/${pdfFileName}`,
          `uploads/reports/${docxFileName}`,
          project.assigned_officer_id || req.user.id,
          req.user.id,
          JSON.stringify({
            overall_compliance: project.overall_compliance,
            serial_number: project.serial_number,
            model: project.model_number
          })
        ]
      );

      // Update instrument status to TESTED
      await conn.execute(`UPDATE instruments SET status = 'TESTED' WHERE id = ?`, [project.instrument_id]);

      return repRes.insertId;
    });

    await logAudit({
      userId: req.user.id,
      action: 'FINALIZE_PROJECT_AND_REPORT',
      entity: 'REPORT',
      entityId: reportId,
      afterState: { report_number: reportNumber, checksum_hash: checksumHash, status: 'FINALIZED' },
      req
    });

    res.json({
      success: true,
      data: {
        report_id: reportId,
        report_number: reportNumber,
        checksum_hash: checksumHash,
        pdf_path: `uploads/reports/${pdfFileName}`,
        docx_path: `uploads/reports/${docxFileName}`,
        message: 'Test Project successfully finalized, locked, and standardized reports generated!'
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitForReview,
  reviewProject,
  finalizeAndApprove
};
