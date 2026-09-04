const { query, execute } = require('../config/db');
const { logAudit } = require('../middleware/audit');

// List Instruments with filtering & pagination
async function listInstruments(req, res, next) {
  try {
    const { search, accuracy_class, manufacturer_id, status } = req.query;
    let sql = `
      SELECT i.*, 
             m.manufacturer_name, m.country as manufacturer_country,
             l.lab_name, l.lab_code,
             u.full_name as created_by_name,
             (SELECT COUNT(*) FROM test_projects WHERE instrument_id = i.id) as total_tests,
             (SELECT COUNT(*) FROM reports WHERE instrument_id = i.id) as total_reports
      FROM instruments i
      JOIN manufacturers m ON i.manufacturer_id = m.id
      JOIN laboratories l ON i.laboratory_id = l.id
      LEFT JOIN users u ON i.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (i.name LIKE ? OR i.model_number LIKE ? OR i.serial_number LIKE ? OR i.instrument_uid LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (accuracy_class) {
      sql += ` AND i.accuracy_class = ?`;
      params.push(accuracy_class);
    }
    if (manufacturer_id) {
      sql += ` AND i.manufacturer_id = ?`;
      params.push(manufacturer_id);
    }
    if (status) {
      sql += ` AND i.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY i.id DESC`;
    const rows = await query(sql, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

// Get Single Instrument with complete lifecycle history (Requirement #26)
async function getInstrumentById(req, res, next) {
  try {
    const { id } = req.params;

    const instruments = await query(
      `SELECT i.*, 
              m.manufacturer_name, m.address as manufacturer_address, m.contact_email as manufacturer_email,
              l.lab_name, l.lab_code, l.city as lab_city,
              u.full_name as created_by_name
       FROM instruments i
       JOIN manufacturers m ON i.manufacturer_id = m.id
       JOIN laboratories l ON i.laboratory_id = l.id
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.id = ?`,
      [id]
    );

    if (!instruments || instruments.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Instrument not found' }
      });
    }

    const instrument = instruments[0];

    // Attached documents & evidence
    const documents = await query(
      `SELECT d.*, u.full_name as uploaded_by_name 
       FROM instrument_documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.instrument_id = ? 
       ORDER BY d.created_at DESC`,
      [id]
    );

    // Test Project History (All past and present type evaluation projects)
    const testProjects = await query(
      `SELECT tp.id, tp.project_uid, tp.status, tp.overall_compliance, tp.start_date, tp.actual_completion_date,
              rv.version_code as rule_version,
              u.full_name as officer_name
       FROM test_projects tp
       JOIN rule_versions rv ON tp.rule_version_id = rv.id
       LEFT JOIN users u ON tp.assigned_officer_id = u.id
       WHERE tp.instrument_id = ?
       ORDER BY tp.id DESC`,
      [id]
    );

    // Generated Reports Repository for this instrument
    const reports = await query(
      `SELECT r.id, r.report_number, r.report_version, r.status, r.checksum_hash, r.finalized_at, r.pdf_path, r.docx_path,
              u.full_name as approver_name
       FROM reports r
       LEFT JOIN users u ON r.approved_by = u.id
       WHERE r.instrument_id = ?
       ORDER BY r.id DESC`,
      [id]
    );

    // Audit logs for this instrument
    const auditHistory = await query(
      `SELECT a.*, u.full_name as user_name
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.entity = 'INSTRUMENT' AND a.entity_id = ?
       ORDER BY a.created_at DESC`,
      [String(id)]
    );

    res.json({
      success: true,
      data: {
        instrument,
        documents,
        test_projects: testProjects,
        reports,
        audit_history: auditHistory
      }
    });
  } catch (error) {
    next(error);
  }
}

// Register New NAWI Instrument
async function registerInstrument(req, res, next) {
  try {
    const {
      name,
      model_number,
      serial_number,
      manufacturer_id,
      laboratory_id,
      accuracy_class,
      max_capacity,
      min_capacity,
      verification_scale_interval_e,
      actual_scale_interval_d,
      number_of_intervals_n,
      unit = 'g',
      tare_type = 'Subtractive Tare',
      display_type = 'Digital LCD',
      software_version = 'v1.0.0',
      temperature_min = 10,
      temperature_max = 40,
      voltage_nominal = '230V AC, 50Hz'
    } = req.body;

    // Validation
    if (!name || !model_number || !serial_number || !accuracy_class || !max_capacity || !verification_scale_interval_e) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required instrument parameters (name, model, serial, class, max, e)' }
      });
    }

    // Check duplicate serial number
    const existing = await query('SELECT id FROM instruments WHERE serial_number = ?', [serial_number]);
    if (existing && existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_SERIAL', message: `An instrument with serial number '${serial_number}' is already registered` }
      });
    }

    // Calculate n if not provided: n = Max / e
    const n = number_of_intervals_n ? parseInt(number_of_intervals_n, 10) : Math.round(Number(max_capacity) / Number(verification_scale_interval_e));

    // Generate unique UID
    const timestamp = Date.now().toString().slice(-4);
    const instrumentUid = `IND-NAWI-${new Date().getFullYear()}-${timestamp}`;

    const result = await execute(
      `INSERT INTO instruments 
       (instrument_uid, name, model_number, serial_number, manufacturer_id, laboratory_id, accuracy_class,
        max_capacity, min_capacity, verification_scale_interval_e, actual_scale_interval_d, number_of_intervals_n,
        unit, tare_type, display_type, software_version, temperature_min, temperature_max, voltage_nominal, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REGISTERED', ?)`,
      [
        instrumentUid,
        name,
        model_number,
        serial_number,
        manufacturer_id || 1,
        laboratory_id || 1,
        accuracy_class,
        max_capacity,
        min_capacity || (Number(verification_scale_interval_e) * 10),
        verification_scale_interval_e,
        actual_scale_interval_d || verification_scale_interval_e,
        n,
        unit,
        tare_type,
        display_type,
        software_version,
        temperature_min,
        temperature_max,
        voltage_nominal,
        req.user.id
      ]
    );

    const newId = result.insertId;

    await logAudit({
      userId: req.user.id,
      action: 'REGISTER_INSTRUMENT',
      entity: 'INSTRUMENT',
      entityId: newId,
      afterState: { id: newId, uid: instrumentUid, name, serial_number, accuracy_class },
      req
    });

    res.status(201).json({
      success: true,
      data: {
        id: newId,
        instrument_uid: instrumentUid,
        message: 'Instrument successfully registered in DoCA legal metrology repository'
      }
    });
  } catch (error) {
    next(error);
  }
}

// Upload Evidence / Document to Instrument
async function uploadInstrumentDocument(req, res, next) {
  try {
    const { id } = req.params;
    const { title, document_type = 'PHOTO' } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file was uploaded' }
      });
    }

    const filePath = `uploads/documents/${req.file.filename}`;
    const result = await execute(
      `INSERT INTO instrument_documents 
       (instrument_id, title, document_type, file_path, file_size, mime_type, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title || req.file.originalname,
        document_type,
        filePath,
        req.file.size,
        req.file.mimetype,
        req.user.id
      ]
    );

    await logAudit({
      userId: req.user.id,
      action: 'UPLOAD_DOCUMENT',
      entity: 'INSTRUMENT_DOCUMENT',
      entityId: result.insertId,
      afterState: { instrument_id: id, filename: req.file.filename },
      req
    });

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        file_path: filePath,
        message: 'Document successfully uploaded'
      }
    });
  } catch (error) {
    next(error);
  }
}

// Get auxiliary data: manufacturers and laboratories
async function getAuxiliaryData(req, res, next) {
  try {
    const manufacturers = await query('SELECT * FROM manufacturers ORDER BY manufacturer_name ASC');
    const laboratories = await query('SELECT * FROM laboratories ORDER BY lab_name ASC');
    res.json({
      success: true,
      data: { manufacturers, laboratories }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listInstruments,
  getInstrumentById,
  registerInstrument,
  uploadInstrumentDocument,
  getAuxiliaryData
};
