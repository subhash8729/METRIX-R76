const path = require('path');
const fs = require('fs');
const { query } = require('../config/db');

// Searchable Digital Repository
async function listReports(req, res, next) {
  try {
    const {
      search,
      status,
      compliance,
      accuracy_class,
      startDate,
      endDate,
      limit = 20,
      offset = 0
    } = req.query;

    let sql = `
      SELECT r.*,
             tp.project_uid, tp.overall_compliance,
             i.name as instrument_name, i.model_number, i.serial_number, i.accuracy_class, i.max_capacity, i.unit,
             m.manufacturer_name,
             l.lab_name, l.lab_code,
             rv.version_code as rule_version,
             ug.full_name as generated_by_name,
             ua.full_name as approved_by_name
      FROM reports r
      JOIN test_projects tp ON r.project_id = tp.id
      JOIN instruments i ON r.instrument_id = i.id
      JOIN manufacturers m ON i.manufacturer_id = m.id
      JOIN laboratories l ON tp.laboratory_id = l.id
      JOIN rule_versions rv ON r.rule_version_id = rv.id
      LEFT JOIN users ug ON r.generated_by = ug.id
      LEFT JOIN users ua ON r.approved_by = ua.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (r.report_number LIKE ? OR i.serial_number LIKE ? OR i.model_number LIKE ? OR i.name LIKE ? OR m.manufacturer_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      sql += ` AND r.status = ?`;
      params.push(status);
    }
    if (compliance) {
      sql += ` AND tp.overall_compliance = ?`;
      params.push(compliance);
    }
    if (accuracy_class) {
      sql += ` AND i.accuracy_class = ?`;
      params.push(accuracy_class);
    }
    if (startDate) {
      sql += ` AND r.created_at >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND r.created_at <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY r.id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const rows = await query(sql, params);

    // Get total count
    const [countRow] = await query('SELECT COUNT(*) as total FROM reports');

    res.json({
      success: true,
      data: {
        reports: rows,
        total: countRow.total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      }
    });
  } catch (error) {
    next(error);
  }
}

// Get Single Report Details
async function getReportById(req, res, next) {
  try {
    const { id } = req.params;

    const reports = await query(
      `SELECT r.*,
              tp.project_uid, tp.overall_compliance, tp.start_date, tp.actual_completion_date,
              i.name as instrument_name, i.model_number, i.serial_number, i.accuracy_class, i.max_capacity,
              i.min_capacity, i.verification_scale_interval_e, i.actual_scale_interval_d, i.number_of_intervals_n,
              i.unit, i.tare_type,
              m.manufacturer_name, m.address as manufacturer_address,
              l.lab_name, l.lab_code, l.address as lab_address,
              rv.version_code as rule_version,
              ug.full_name as generated_by_name,
              ua.full_name as approved_by_name
       FROM reports r
       JOIN test_projects tp ON r.project_id = tp.id
       JOIN instruments i ON r.instrument_id = i.id
       JOIN manufacturers m ON i.manufacturer_id = m.id
       JOIN laboratories l ON tp.laboratory_id = l.id
       JOIN rule_versions rv ON r.rule_version_id = rv.id
       LEFT JOIN users ug ON r.generated_by = ug.id
       LEFT JOIN users ua ON r.approved_by = ua.id
       WHERE r.id = ?`,
      [id]
    );

    if (!reports || reports.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Report not found' }
      });
    }

    res.json({ success: true, data: reports[0] });
  } catch (error) {
    next(error);
  }
}

// Download PDF
async function downloadPDF(req, res, next) {
  try {
    const { id } = req.params;
    const [report] = await query('SELECT * FROM reports WHERE id = ?', [id]);
    if (!report) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Report not found' } });
    }

    const filePath = path.resolve(__dirname, '../../', report.pdf_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: { code: 'FILE_MISSING', message: 'Report PDF file is not found on server' } });
    }

    res.download(filePath, `${report.report_number}.pdf`);
  } catch (error) {
    next(error);
  }
}

// Download DOCX
async function downloadDOCX(req, res, next) {
  try {
    const { id } = req.params;
    const [report] = await query('SELECT * FROM reports WHERE id = ?', [id]);
    if (!report) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Report not found' } });
    }

    const filePath = path.resolve(__dirname, '../../', report.docx_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: { code: 'FILE_MISSING', message: 'Report DOCX file is not found on server' } });
    }

    res.download(filePath, `${report.report_number}.docx`);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listReports,
  getReportById,
  downloadPDF,
  downloadDOCX
};
