/**
 * OIML R-76 Overall Compliance Evaluation and Explainability Engine
 * Compiles all test results and provides transparent "Why did this result happen?" audits.
 */

const { query } = require('../config/db');

async function evaluateProjectCompliance(projectId) {
  // Fetch all test instances for this project
  const testInstances = await query(
    `SELECT ti.id, ti.test_definition_id, ti.status, ti.compliance_result, ti.compliance_summary,
            td.test_code, td.clause_reference, td.test_name, td.is_mandatory
     FROM test_instances ti
     JOIN test_definitions td ON ti.test_definition_id = td.id
     WHERE ti.project_id = ?
     ORDER BY td.sequence_order ASC`,
    [projectId]
  );

  if (!testInstances || testInstances.length === 0) {
    return {
      overall_compliance: 'PENDING',
      summary: 'No tests have been initiated for this test project',
      breakdown: []
    };
  }

  let totalTests = testInstances.length;
  let completedCount = 0;
  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;
  let failedTests = [];

  const breakdown = testInstances.map(ti => {
    if (ti.status === 'COMPLETED') completedCount++;
    if (ti.compliance_result === 'PASS') passCount++;
    if (ti.compliance_result === 'FAIL') {
      failCount++;
      failedTests.push({
        test_code: ti.test_code,
        clause: ti.clause_reference,
        name: ti.test_name,
        summary: ti.compliance_summary
      });
    }
    if (ti.compliance_result === 'WARNING') warningCount++;

    return {
      test_instance_id: ti.id,
      test_code: ti.test_code,
      clause: ti.clause_reference,
      name: ti.test_name,
      status: ti.status,
      compliance_result: ti.compliance_result,
      summary: ti.compliance_summary,
      is_mandatory: Boolean(ti.is_mandatory)
    };
  });

  let overallCompliance = 'PENDING';
  let summary = '';

  if (failCount > 0) {
    overallCompliance = 'FAIL';
    const failedList = failedTests.map(f => `${f.name} (${f.clause}): ${f.summary || 'Exceeded permissible limits'}`).join(' | ');
    summary = `Instrument NON-COMPLIANT with OIML R-76. Failed in ${failCount} test(s): ${failedList}`;
  } else if (completedCount === totalTests && passCount === totalTests) {
    overallCompliance = 'PASS';
    summary = `Instrument fully CONFORMS to all mandatory metrological tests under OIML Recommendation R-76. All ${passCount} tests passed within permissible limits.`;
  } else if (warningCount > 0 && failCount === 0) {
    overallCompliance = 'WARNING';
    summary = `Testing finished with ${warningCount} test warning(s). Minor deviations noted.`;
  } else {
    overallCompliance = 'PENDING';
    summary = `Testing in progress. ${completedCount} of ${totalTests} tests completed.`;
  }

  return {
    overall_compliance: overallCompliance,
    summary,
    total_tests: totalTests,
    completed_count: completedCount,
    pass_count: passCount,
    fail_count: failCount,
    warning_count: warningCount,
    failed_tests: failedTests,
    breakdown
  };
}

module.exports = {
  evaluateProjectCompliance
};
