/**
 * OIML R-76 Test Applicability Engine
 * Resolves which tests are required for a given instrument configuration
 * and provides clear justification for SIH auditability.
 */

const { query } = require('../config/db');

async function getApplicableTestsForInstrument({ instrument, ruleVersionId }) {
  // Fetch active test definitions for this rule version
  const testDefs = await query(
    `SELECT td.* 
     FROM test_definitions td
     WHERE td.rule_version_id = ?
     ORDER BY td.sequence_order ASC`,
    [ruleVersionId]
  );

  const evaluatedTests = [];

  for (const test of testDefs) {
    const criteria = typeof test.applicability_criteria === 'string'
      ? JSON.parse(test.applicability_criteria)
      : (test.applicability_criteria || {});

    let isApplicable = true;
    const reasons = [];

    // 1. Accuracy Class Match
    if (criteria.classes && Array.isArray(criteria.classes)) {
      if (criteria.classes.includes(instrument.accuracy_class)) {
        reasons.push(`Mandatory for Accuracy Class ${instrument.accuracy_class.replace('CLASS_', '')}`);
      } else {
        isApplicable = false;
        reasons.push(`Not applicable for Accuracy Class ${instrument.accuracy_class}`);
      }
    }

    // 2. Tare Requirement
    if (criteria.requires_tare && (!instrument.tare_type || instrument.tare_type === 'None')) {
      isApplicable = false;
      reasons.push('Instrument does not support tare facilities');
    } else if (criteria.requires_tare) {
      reasons.push(`Instrument configured with ${instrument.tare_type}`);
    }

    // 3. Minimum Scale Intervals (n)
    if (criteria.min_n && instrument.number_of_intervals_n < criteria.min_n) {
      isApplicable = false;
      reasons.push(`Instrument n (${instrument.number_of_intervals_n}) is less than required minimum ${criteria.min_n}`);
    }

    evaluatedTests.push({
      test_definition_id: test.id,
      test_code: test.test_code,
      clause_reference: test.clause_reference,
      test_name: test.test_name,
      category: test.category,
      sequence_order: test.sequence_order,
      is_mandatory: test.is_mandatory,
      is_applicable: isApplicable,
      applicability_reason: reasons.join('; ')
    });
  }

  return evaluatedTests;
}

module.exports = {
  getApplicableTestsForInstrument
};
