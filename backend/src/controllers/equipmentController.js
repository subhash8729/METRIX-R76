const { query, execute } = require('../config/db');
const { logAudit } = require('../middleware/audit');

// List Test Equipment with calibration status
async function listEquipment(req, res, next) {
  try {
    const equipment = await query(
      `SELECT e.*,
              CASE 
                WHEN e.calibration_expiry < CURDATE() THEN 'EXPIRED'
                WHEN e.calibration_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'EXPIRING_SOON'
                ELSE 'CALIBRATED'
              END as computed_status
       FROM test_equipment e
       ORDER BY e.id ASC`
    );

    res.json({ success: true, data: equipment });
  } catch (error) {
    next(error);
  }
}

// Add New Test Equipment
async function addEquipment(req, res, next) {
  try {
    const {
      equipment_code,
      name,
      manufacturer,
      model,
      serial_number,
      accuracy_class = 'E2',
      capacity_range,
      calibration_date,
      calibration_expiry,
      certificate_number
    } = req.body;

    if (!equipment_code || !name) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Equipment code and name are required' }
      });
    }

    const result = await execute(
      `INSERT INTO test_equipment 
       (equipment_code, name, manufacturer, model, serial_number, accuracy_class, capacity_range, calibration_date, calibration_expiry, certificate_number, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CALIBRATED')`,
      [
        equipment_code,
        name,
        manufacturer || 'Standard Lab Equipment',
        model || 'N/A',
        serial_number || 'N/A',
        accuracy_class,
        capacity_range,
        calibration_date || new Date().toISOString().split('T')[0],
        calibration_expiry || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        certificate_number || 'CERT-2026-001'
      ]
    );

    await logAudit({
      userId: req.user.id,
      action: 'ADD_TEST_EQUIPMENT',
      entity: 'TEST_EQUIPMENT',
      entityId: result.insertId,
      afterState: { equipment_code, name },
      req
    });

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        message: 'Test equipment successfully added to laboratory inventory'
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listEquipment,
  addEquipment
};
