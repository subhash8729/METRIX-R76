const { query, execute, transaction } = require('../config/db');
const {
  calculateTurningPoint,
  evaluateZeroSettingTest,
  evaluateWeighingPerformanceObservation,
  evaluateRepeatabilitySeries,
  evaluateEccentricityTest,
  evaluateDiscriminationTest
} = require('../rule-engine/nawiCalculations');
const { calculateMPE } = require('../rule-engine/mpeCalculator');
const { evaluateProjectCompliance } = require('../rule-engine/complianceEngine');
const { logAudit } = require('../middleware/audit');

// Get Test Instance Details with all Measurement Sets and Observations
async function getTestInstanceDetails(req, res, next) {
  try {
    const { testInstanceId } = req.params;

    const testInstances = await query(
      `SELECT ti.*,
              tp.project_uid, tp.status as project_status, tp.instrument_id, tp.rule_version_id,
              td.test_code, td.clause_reference, td.test_name, td.category, td.sequence_order, td.is_mandatory,
              td.description as test_description, td.applicability_criteria, td.formula_definition, td.permissible_limit_rules,
              i.name as instrument_name, i.model_number, i.serial_number, i.accuracy_class, i.max_capacity,
              i.min_capacity, i.verification_scale_interval_e, i.actual_scale_interval_d, i.unit,
              rv.version_code as rule_version, rv.rules_config
       FROM test_instances ti
       JOIN test_projects tp ON ti.project_id = tp.id
       JOIN test_definitions td ON ti.test_definition_id = td.id
       JOIN instruments i ON tp.instrument_id = i.id
       JOIN rule_versions rv ON tp.rule_version_id = rv.id
       WHERE ti.id = ?`,
      [testInstanceId]
    );

    if (!testInstances || testInstances.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Test instance not found' }
      });
    }

    const testInstance = testInstances[0];

    // Fetch measurement sets
    const measurementSets = await query(
      `SELECT * FROM measurement_sets WHERE test_instance_id = ? ORDER BY id ASC`,
      [testInstanceId]
    );

    // Fetch observations for each measurement set
    for (const ms of measurementSets) {
      const observations = await query(
        `SELECT o.*, u.full_name as entered_by_name
         FROM observations o
         LEFT JOIN users u ON o.entered_by = u.id
         WHERE o.measurement_set_id = ? AND o.is_latest = TRUE
         ORDER BY o.sequence_number ASC`,
        [ms.id]
      );
      ms.observations = observations.map(obs => ({
        ...obs,
        calculation_explanation: typeof obs.calculation_explanation === 'string'
          ? JSON.parse(obs.calculation_explanation)
          : obs.calculation_explanation
      }));
    }

    res.json({
      success: true,
      data: {
        test_instance: testInstance,
        measurement_sets: measurementSets
      }
    });
  } catch (error) {
    next(error);
  }
}

// Live calculation preview endpoint (Authoritative backend calculation for UI live preview)
async function liveCalculate(req, res, next) {
  try {
    const {
      accuracyClass,
      verificationIntervalE,
      actualIntervalD,
      loadApplied,
      indicatedValue,
      deltaLoad = 0,
      zeroError = 0,
      testCode = 'TEST-WEIGH-PERF'
    } = req.body;

    if (!accuracyClass || !verificationIntervalE) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'accuracyClass and verificationIntervalE are required' }
      });
    }

    let result = null;

    if (testCode === 'TEST-ZERO-TARE') {
      result = evaluateZeroSettingTest({
        indicatedValue: Number(indicatedValue || 0),
        deltaLoad: Number(deltaLoad || 0),
        verificationIntervalE: Number(verificationIntervalE)
      });
    } else if (testCode === 'TEST-DISCRIMINATION') {
      const { extraLoadApplied, finalIndication } = req.body;
      result = evaluateDiscriminationTest({
        loadApplied: Number(loadApplied || 0),
        initialIndication: Number(indicatedValue || 0),
        extraLoadApplied: Number(extraLoadApplied || (1.4 * (actualIntervalD || verificationIntervalE))),
        finalIndication: Number(finalIndication || 0),
        actualIntervalD: Number(actualIntervalD || verificationIntervalE)
      });
    } else {
      result = evaluateWeighingPerformanceObservation({
        loadApplied: Number(loadApplied || 0),
        indicatedValue: Number(indicatedValue || 0),
        deltaLoad: Number(deltaLoad || 0),
        verificationIntervalE: Number(verificationIntervalE),
        accuracyClass,
        zeroError: Number(zeroError || 0)
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

// Create Measurement Set
async function createMeasurementSet(req, res, next) {
  try {
    const { testInstanceId } = req.params;
    const {
      set_name,
      load_percentage = 0,
      load_value = 0,
      unit = 'g',
      position = 'Center',
      cycle_number = 1,
      tare_value = 0,
      notes = ''
    } = req.body;

    const result = await execute(
      `INSERT INTO measurement_sets 
       (test_instance_id, set_name, load_percentage, load_value, unit, position, cycle_number, tare_value, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [testInstanceId, set_name, load_percentage, load_value, unit, position, cycle_number, tare_value, notes]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        test_instance_id: testInstanceId,
        set_name,
        load_value
      }
    });
  } catch (error) {
    next(error);
  }
}

// Add or Update Observation with Automated Rule Engine Calculation
async function saveObservation(req, res, next) {
  try {
    const { testInstanceId, measurementSetId } = req.params;
    const {
      observationId,
      load_applied,
      indicated_value,
      delta_load = 0,
      zero_error = 0,
      notes = '',
      reason_for_change = 'Initial observation entry'
    } = req.body;

    // Fetch test instance & instrument context for calculation
    const [context] = await query(
      `SELECT ti.id, ti.project_id, td.test_code,
              i.accuracy_class, i.verification_scale_interval_e, i.actual_scale_interval_d,
              rv.rules_config
       FROM test_instances ti
       JOIN test_definitions td ON ti.test_definition_id = td.id
       JOIN test_projects tp ON ti.project_id = tp.id
       JOIN instruments i ON tp.instrument_id = i.id
       JOIN rule_versions rv ON tp.rule_version_id = rv.id
       WHERE ti.id = ?`,
      [testInstanceId]
    );

    if (!context) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Test instance context not found' }
      });
    }

    const ruleConfig = typeof context.rules_config === 'string'
      ? JSON.parse(context.rules_config)
      : context.rules_config;

    // Perform Automated Calculations according to OIML Clause
    let calcResult = null;

    if (context.test_code === 'TEST-ZERO-TARE') {
      calcResult = evaluateZeroSettingTest({
        indicatedValue: indicated_value,
        deltaLoad: delta_load,
        verificationIntervalE: context.verification_scale_interval_e
      });
    } else {
      calcResult = evaluateWeighingPerformanceObservation({
        loadApplied: load_applied,
        indicatedValue: indicated_value,
        deltaLoad: delta_load,
        verificationIntervalE: context.verification_scale_interval_e,
        accuracyClass: context.accuracy_class,
        zeroError: zero_error,
        ruleConfig
      });
    }

    const P = calcResult.calculated_turning_point_P;
    const E = calcResult.calculated_error_E;
    const Ec = calcResult.corrected_error_Ec;
    const mpe = calcResult.permissible_error_mpe;
    const status = calcResult.status;
    const explanation = calcResult.explanation;

    const savedId = await transaction(async (conn) => {
      let currentObsId = observationId;

      if (currentObsId) {
        // Fetch previous state for history
        const [prev] = await conn.query('SELECT * FROM observations WHERE id = ?', [currentObsId]);
        if (prev && prev.length > 0) {
          const old = prev[0];
          // Record to immutable history table
          await conn.execute(
            `INSERT INTO observation_history 
             (observation_id, measurement_set_id, load_applied, indicated_value, delta_load,
              calculated_turning_point_P, calculated_error_E, corrected_error_Ec, permissible_error_mpe,
              status, reason_for_change, changed_by, version_number)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              old.id,
              old.measurement_set_id,
              old.load_applied,
              old.indicated_value,
              old.delta_load,
              old.calculated_turning_point_P,
              old.calculated_error_E,
              old.corrected_error_Ec,
              old.permissible_error_mpe,
              old.status,
              reason_for_change,
              req.user.id,
              old.version_number
            ]
          );

          // Update current observation
          const newVersion = old.version_number + 1;
          await conn.execute(
            `UPDATE observations 
             SET load_applied = ?, indicated_value = ?, delta_load = ?,
                 calculated_turning_point_P = ?, calculated_error_E = ?, corrected_error_Ec = ?,
                 permissible_error_mpe = ?, status = ?, calculation_explanation = ?,
                 notes = ?, entered_by = ?, version_number = ?
             WHERE id = ?`,
            [
              load_applied, indicated_value, delta_load,
              P, E, Ec, mpe, status, JSON.stringify(explanation),
              notes, req.user.id, newVersion, currentObsId
            ]
          );
        }
      } else {
        // Insert new observation
        const [insRes] = await conn.execute(
          `INSERT INTO observations 
           (measurement_set_id, load_applied, indicated_value, delta_load,
            calculated_turning_point_P, calculated_error_E, corrected_error_Ec, permissible_error_mpe,
            status, calculation_explanation, notes, entered_by, version_number, is_latest)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, TRUE)`,
          [
            measurementSetId, load_applied, indicated_value, delta_load,
            P, E, Ec, mpe, status, JSON.stringify(explanation), notes, req.user.id
          ]
        );
        currentObsId = insRes.insertId;
      }

      // Mark test instance as IN_PROGRESS
      await conn.execute(
        `UPDATE test_instances SET status = 'IN_PROGRESS' WHERE id = ? AND status = 'PENDING'`,
        [testInstanceId]
      );

      return currentObsId;
    });

    await logAudit({
      userId: req.user.id,
      action: observationId ? 'UPDATE_OBSERVATION' : 'CREATE_OBSERVATION',
      entity: 'OBSERVATION',
      entityId: savedId,
      afterState: { load_applied, indicated_value, delta_load, Ec, mpe, status },
      req
    });

    res.status(200).json({
      success: true,
      data: {
        observation_id: savedId,
        load_applied,
        indicated_value,
        delta_load,
        calculated_turning_point_P: P,
        calculated_error_E: E,
        corrected_error_Ec: Ec,
        permissible_error_mpe: mpe,
        status,
        calculation_explanation: explanation
      }
    });
  } catch (error) {
    next(error);
  }
}

// Complete and Evaluate entire Test Instance
async function evaluateTestInstance(req, res, next) {
  try {
    const { testInstanceId } = req.params;

    // Fetch all observations for this test instance
    const observations = await query(
      `SELECT o.*, ms.set_name, ms.position, ms.load_value
       FROM observations o
       JOIN measurement_sets ms ON o.measurement_set_id = ms.id
       WHERE ms.test_instance_id = ? AND o.is_latest = TRUE`,
      [testInstanceId]
    );

    if (!observations || observations.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_OBSERVATIONS', message: 'Cannot evaluate test: No observations recorded yet' }
      });
    }

    const hasFailure = observations.some(o => o.status === 'FAIL');
    const allPass = observations.every(o => o.status === 'PASS');

    const testCompliance = hasFailure ? 'FAIL' : (allPass ? 'PASS' : 'WARNING');
    const summary = hasFailure
      ? `Test failed: One or more observations exceeded permissible error limits (mpe).`
      : `Test passed: All ${observations.length} observations within permissible error limits as per OIML R-76.`;

    await execute(
      `UPDATE test_instances 
       SET status = 'COMPLETED', compliance_result = ?, compliance_summary = ?, calculated_at = NOW(), evaluated_by = ?
       WHERE id = ?`,
      [testCompliance, summary, req.user.id, testInstanceId]
    );

    // Get project id to update overall project compliance
    const [ti] = await query('SELECT project_id FROM test_instances WHERE id = ?', [testInstanceId]);
    if (ti) {
      const projComp = await evaluateProjectCompliance(ti.project_id);
      await execute(
        `UPDATE test_projects 
         SET overall_compliance = ? 
         WHERE id = ?`,
        [projComp.overall_compliance, ti.project_id]
      );
    }

    await logAudit({
      userId: req.user.id,
      action: 'EVALUATE_TEST_INSTANCE',
      entity: 'TEST_INSTANCE',
      entityId: testInstanceId,
      afterState: { compliance_result: testCompliance, summary },
      req
    });

    res.json({
      success: true,
      data: {
        test_instance_id: testInstanceId,
        status: 'COMPLETED',
        compliance_result: testCompliance,
        summary
      }
    });
  } catch (error) {
    next(error);
  }
}

// Upload Evidence File for Test Observation
async function uploadObservationEvidence(req, res, next) {
  try {
    const { observationId } = req.params;
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No evidence file uploaded' }
      });
    }

    const filePath = `uploads/evidence/${req.file.filename}`;
    await execute(
      `UPDATE observations SET evidence_file = ? WHERE id = ?`,
      [filePath, observationId]
    );

    res.json({
      success: true,
      data: {
        observation_id: observationId,
        evidence_file: filePath,
        message: 'Evidence successfully attached to test observation'
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTestInstanceDetails,
  liveCalculate,
  createMeasurementSet,
  saveObservation,
  evaluateTestInstance,
  uploadObservationEvidence
};
