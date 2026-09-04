const { query, execute } = require('../config/db');
const { calculateMPE } = require('../rule-engine/mpeCalculator');
const {
  evaluateWeighingPerformanceObservation,
  evaluateZeroSettingTest,
  evaluateRepeatabilitySeries,
  evaluateEccentricityTest,
  evaluateDiscriminationTest
} = require('../rule-engine/nawiCalculations');
const { logAudit } = require('../middleware/audit');

// List Standards & Rule Versions
async function listRuleVersions(req, res, next) {
  try {
    const versions = await query(
      `SELECT rv.*, rs.standard_code, rs.title as standard_title, rs.organization,
              u.full_name as created_by_name,
              (SELECT COUNT(*) FROM test_definitions WHERE rule_version_id = rv.id) as total_test_definitions,
              (SELECT COUNT(*) FROM test_projects WHERE rule_version_id = rv.id) as projects_using_version
       FROM rule_versions rv
       JOIN rule_standards rs ON rv.standard_id = rs.id
       LEFT JOIN users u ON rv.created_by = u.id
       ORDER BY rv.id DESC`
    );

    const testDefinitions = await query(
      `SELECT td.*, rv.version_code
       FROM test_definitions td
       JOIN rule_versions rv ON td.rule_version_id = rv.id
       ORDER BY rv.id DESC, td.sequence_order ASC`
    );

    res.json({
      success: true,
      data: {
        rule_versions: versions.map(v => ({
          ...v,
          rules_config: typeof v.rules_config === 'string' ? JSON.parse(v.rules_config) : v.rules_config
        })),
        test_definitions: testDefinitions.map(t => ({
          ...t,
          applicability_criteria: typeof t.applicability_criteria === 'string' ? JSON.parse(t.applicability_criteria) : t.applicability_criteria,
          formula_definition: typeof t.formula_definition === 'string' ? JSON.parse(t.formula_definition) : t.formula_definition,
          permissible_limit_rules: typeof t.permissible_limit_rules === 'string' ? JSON.parse(t.permissible_limit_rules) : t.permissible_limit_rules
        }))
      }
    });
  } catch (error) {
    next(error);
  }
}

// Create New Draft Rule Version (Requirement #39)
async function createDraftRuleVersion(req, res, next) {
  try {
    const {
      standard_id = 1,
      version_code,
      release_date,
      changelog,
      rules_config
    } = req.body;

    if (!version_code) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'version_code is required' }
      });
    }

    const result = await execute(
      `INSERT INTO rule_versions 
       (standard_id, version_code, release_date, is_active, is_published, changelog, rules_config, created_by)
       VALUES (?, ?, ?, FALSE, FALSE, ?, ?, ?)`,
      [
        standard_id,
        version_code,
        release_date || new Date().toISOString().split('T')[0],
        changelog || 'Draft rule revision',
        rules_config ? JSON.stringify(rules_config) : JSON.stringify({}),
        req.user.id
      ]
    );

    const newVersionId = result.insertId;

    // Clone standard test definitions into this draft version
    const baseDefs = await query('SELECT * FROM test_definitions WHERE rule_version_id = 1');
    for (const def of baseDefs) {
      await execute(
        `INSERT INTO test_definitions 
         (rule_version_id, test_code, clause_reference, test_name, category, sequence_order, is_mandatory, description, applicability_criteria, formula_definition, permissible_limit_rules)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newVersionId,
          def.test_code,
          def.clause_reference,
          def.test_name,
          def.category,
          def.sequence_order,
          def.is_mandatory,
          def.description,
          def.applicability_criteria,
          def.formula_definition,
          def.permissible_limit_rules
        ]
      );
    }

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_DRAFT_RULE_VERSION',
      entity: 'RULE_VERSION',
      entityId: newVersionId,
      afterState: { version_code, changelog },
      req
    });

    res.status(201).json({
      success: true,
      data: {
        id: newVersionId,
        version_code,
        message: 'New draft rule version created successfully with inherited test definitions'
      }
    });
  } catch (error) {
    next(error);
  }
}

// Publish / Activate Rule Version
async function publishRuleVersion(req, res, next) {
  try {
    const { id } = req.params;

    const [rv] = await query('SELECT * FROM rule_versions WHERE id = ?', [id]);
    if (!rv) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rule version not found' } });
    }

    await execute(
      `UPDATE rule_versions SET is_published = TRUE, is_active = TRUE WHERE id = ?`,
      [id]
    );

    await logAudit({
      userId: req.user.id,
      action: 'PUBLISH_RULE_VERSION',
      entity: 'RULE_VERSION',
      entityId: id,
      afterState: { version_code: rv.version_code, is_published: true, is_active: true },
      req
    });

    res.json({
      success: true,
      message: `Rule version '${rv.version_code}' published and activated`
    });
  } catch (error) {
    next(error);
  }
}

// Rule Simulator (Requirement #40: Interactive live simulation for judges)
async function simulateRule(req, res, next) {
  try {
    const {
      ruleVersionId = 1,
      testCode = 'TEST-WEIGH-PERF',
      accuracyClass = 'CLASS_III',
      verificationIntervalE = 5,
      actualIntervalD = 1,
      maxCapacity = 15000,
      loadApplied = 5000,
      indicatedValue = 5000,
      deltaLoad = 0.02,
      zeroError = 0
    } = req.body;

    const [rv] = await query('SELECT rules_config, version_code FROM rule_versions WHERE id = ?', [ruleVersionId]);
    const ruleConfig = rv && rv.rules_config
      ? (typeof rv.rules_config === 'string' ? JSON.parse(rv.rules_config) : rv.rules_config)
      : null;

    let simulationResult = null;

    if (testCode === 'TEST-ZERO-TARE') {
      simulationResult = evaluateZeroSettingTest({
        indicatedValue: Number(indicatedValue),
        deltaLoad: Number(deltaLoad),
        verificationIntervalE: Number(verificationIntervalE)
      });
    } else if (testCode === 'TEST-DISCRIMINATION') {
      simulationResult = evaluateDiscriminationTest({
        loadApplied: Number(loadApplied),
        initialIndication: Number(indicatedValue),
        extraLoadApplied: Number(req.body.extraLoadApplied || 1.4 * actualIntervalD),
        finalIndication: Number(req.body.finalIndication || (Number(indicatedValue) + Number(actualIntervalD))),
        actualIntervalD: Number(actualIntervalD)
      });
    } else {
      simulationResult = evaluateWeighingPerformanceObservation({
        loadApplied: Number(loadApplied),
        indicatedValue: Number(indicatedValue),
        deltaLoad: Number(deltaLoad),
        verificationIntervalE: Number(verificationIntervalE),
        accuracyClass,
        zeroError: Number(zeroError),
        ruleConfig
      });
    }

    res.json({
      success: true,
      data: {
        simulation_context: {
          rule_version: rv?.version_code || 'OIML-R76-2006-V1',
          test_code: testCode,
          accuracy_class: accuracyClass,
          verification_interval_e: verificationIntervalE,
          actual_interval_d: actualIntervalD,
          load_applied: loadApplied,
          indicated_value: indicatedValue,
          delta_load: deltaLoad
        },
        result: simulationResult
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listRuleVersions,
  createDraftRuleVersion,
  publishRuleVersion,
  simulateRule
};
