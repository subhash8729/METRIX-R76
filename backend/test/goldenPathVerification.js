const fs = require('fs');
const path = require('path');
const assert = require('assert');

const API_HOST = 'http://127.0.0.1:5000/api';

async function req(endpoint, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_HOST}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`[${res.status}] ${data?.error?.message || 'Request failed'}`);
  }
  return data;
}

async function verifyGoldenPath() {
  console.log('================================================================');
  console.log('  METRIX-R76: FULL SIH 2026 GOLDEN PATH REGULATORY WORKFLOW   ');
  console.log('================================================================\n');

  // STEP 1: Login as Lab Officer
  console.log('-> STEP 1: Authenticating as Test Officer (officer@metrix.gov.in)...');
  const officerLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: 'officer@metrix.gov.in', password: 'Officer@123' }
  });
  const officerToken = officerLogin.data.token;
  assert.strictEqual(officerLogin.data.user.role, 'LAB_OFFICER');
  console.log(`   [PASS] Authenticated: ${officerLogin.data.user.full_name} (${officerLogin.data.user.role})\n`);

  // STEP 2: Register a new NAWI instrument
  console.log('-> STEP 2: Registering a new NAWI instrument (Class III Electronic Bench Scale)...');
  const uniqueSerial = `SIH-VERIFY-${Date.now().toString().slice(-4)}`;
  const regInst = await req('/instruments', {
    method: 'POST',
    body: {
      name: 'Electronic Retail Weighing Scale',
      model_number: 'RET-3000',
      serial_number: uniqueSerial,
      manufacturer_id: 3, // Essae-Teraoka
      laboratory_id: 1, // RRSL Faridabad
      accuracy_class: 'CLASS_III',
      max_capacity: 15000,
      min_capacity: 100,
      verification_scale_interval_e: 5,
      actual_scale_interval_d: 1,
      unit: 'g',
      tare_type: 'Subtractive Tare',
      software_version: 'v2.0.4'
    }
  }, officerToken);
  const newInstrumentId = regInst.data.id;
  console.log(`   [PASS] Registered Instrument UID: ${regInst.data.instrument_uid} (ID: ${newInstrumentId})\n`);

  // STEP 3: Create a Type Evaluation Project
  console.log('-> STEP 3: Initializing Type Evaluation Test Project under OIML-R76-2006-V1...');
  const createProj = await req('/test-projects', {
    method: 'POST',
    body: {
      instrument_id: newInstrumentId,
      laboratory_id: 1,
      rule_version_id: 1, // OIML R-76-1:2006
      start_date: new Date().toISOString().split('T')[0],
      environmental_conditions: {
        temperature_celsius: 23.1,
        relative_humidity_percent: 48.5,
        atmospheric_pressure_hpa: 1012.4,
        location: 'RRSL Cleanroom Testing Bay 1'
      },
      equipment_ids: [1, 2, 3],
      notes: 'SIH 2026 Live Golden Path Evaluation'
    }
  }, officerToken);
  const newProjectId = createProj.data.id;
  console.log(`   [PASS] Project Created: ${createProj.data.project_uid} (Applicable tests: ${createProj.data.applicable_tests_count})\n`);

  // STEP 4: Inspect Applicable Tests
  console.log('-> STEP 4: Querying Auto-Resolved Applicable Tests...');
  const projDetails = await req(`/test-projects/${newProjectId}`, {}, officerToken);
  const tests = projDetails.data.test_instances;
  console.log(`   [PASS] Rule engine auto-generated ${tests.length} test instances:`);
  tests.forEach(t => console.log(`      * ${t.clause_reference}: ${t.test_name} [${t.status}]`));
  console.log('');

  // STEP 5: Digital Test Entry & Automated Calculation for Zero-Setting Test
  const zeroTest = tests.find(t => t.test_code === 'TEST-ZERO-TARE');
  console.log(`-> STEP 5: Entering Observation for ${zeroTest.test_name}...`);
  // Create measurement set
  const zeroSet = await req(`/tests/instances/${zeroTest.id}/sets`, {
    method: 'POST',
    body: { set_name: 'No-Load Zero Setting', load_value: 0, position: 'Center' }
  }, officerToken);

  // Save observation with automated turning point
  // L = 0, I = 0, delta_L = 0.04 -> P = 0 + 2.5 - 0.04 = 2.46 -> E0 = 2.46 -> exceeds 0.25e (1.25g)
  // For e = 5: 0.5e = 2.5. delta_L = 2.48 -> P = 0 + 2.5 - 2.48 = 0.02g. E0 = 0.02g <= 0.25e (1.25g) -> PASS!
  const zeroObs = await req(`/tests/instances/${zeroTest.id}/sets/${zeroSet.data.id}/observations`, {
    method: 'POST',
    body: {
      load_applied: 0,
      indicated_value: 0,
      delta_load: 2.48,
      notes: 'No-load zero setting observation'
    }
  }, officerToken);
  assert.strictEqual(zeroObs.data.status, 'PASS');
  console.log(`   [PASS] Zero Error E0 = ${zeroObs.data.calculated_error_E} g (mpe limit: ±${zeroObs.data.permissible_error_mpe} g) -> Status: ${zeroObs.data.status}\n`);

  // STEP 6: Digital Test Entry for Weighing Performance Test (Clause A.4.4)
  const wpTest = tests.find(t => t.test_code === 'TEST-WEIGH-PERF');
  console.log(`-> STEP 6: Entering Observations for ${wpTest.test_name}...`);
  const wpSet = await req(`/tests/instances/${wpTest.id}/sets`, {
    method: 'POST',
    body: { set_name: 'Increasing Loads', load_value: 5000, position: 'Center' }
  }, officerToken);

  // Load 5000g: e = 5g -> m/e = 1000 intervals -> Class III Table 6 tier 2 (500e - 2000e) -> mpe = 1.0e = ±5.0g!
  // I = 5000.0, delta_L = 2.50 -> P = 5000 + 2.5 - 2.5 = 5000.0g -> E = 0.0g -> Ec = 0.0 - 0.02 = -0.02g <= ±5.0g -> PASS!
  const wpObs = await req(`/tests/instances/${wpTest.id}/sets/${wpSet.data.id}/observations`, {
    method: 'POST',
    body: {
      load_applied: 5000,
      indicated_value: 5000,
      delta_load: 2.50,
      zero_error: 0.02,
      notes: 'Load step at 5000g'
    }
  }, officerToken);
  assert.strictEqual(wpObs.data.status, 'PASS');
  console.log(`   [PASS] Load L = 5000g: Turning Point P = ${wpObs.data.calculated_turning_point_P} g, Ec = ${wpObs.data.corrected_error_Ec} g (mpe: ±${wpObs.data.permissible_error_mpe} g) -> Status: ${wpObs.data.status}\n`);

  // STEP 7: Complete and Evaluate Test Instances
  console.log('-> STEP 7: Running automated compliance evaluation on test instances...');
  const evalZero = await req(`/tests/instances/${zeroTest.id}/evaluate`, { method: 'POST' }, officerToken);
  assert.strictEqual(evalZero.data.compliance_result, 'PASS');

  const evalWp = await req(`/tests/instances/${wpTest.id}/evaluate`, { method: 'POST' }, officerToken);
  assert.strictEqual(evalWp.data.compliance_result, 'PASS');

  // Complete remaining tests for clean golden path
  for (const t of tests) {
    if (t.id !== zeroTest.id && t.id !== wpTest.id) {
      const s = await req(`/tests/instances/${t.id}/sets`, {
        method: 'POST',
        body: { set_name: 'Standard Load Set', load_value: 1000, position: 'Center' }
      }, officerToken);
      await req(`/tests/instances/${t.id}/sets/${s.data.id}/observations`, {
        method: 'POST',
        body: { load_applied: 1000, indicated_value: 1000, delta_load: 2.50, notes: 'Golden path observation' }
      }, officerToken);
      await req(`/tests/instances/${t.id}/evaluate`, { method: 'POST' }, officerToken);
    }
  }
  console.log(`   [PASS] All test instances completed and evaluated.\n`);

  // STEP 8: Submit for Technical Review (Lab Officer)
  console.log('-> STEP 8: Submitting Test Project for Technical Review...');
  const submitRes = await req(`/reviews/projects/${newProjectId}/submit`, { method: 'POST' }, officerToken);
  assert.strictEqual(submitRes.data.status, 'UNDER_REVIEW');
  console.log(`   [PASS] Project status transitioned to ${submitRes.data.status} (Overall compliance: ${submitRes.data.overall_compliance})\n`);

  // STEP 9: Login as Reviewer and Perform Technical Review
  console.log('-> STEP 9: Authenticating as Technical Reviewer (reviewer@metrix.gov.in)...');
  const revLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: 'reviewer@metrix.gov.in', password: 'Reviewer@123' }
  });
  const reviewerToken = revLogin.data.token;

  console.log('-> STEP 10: Reviewer approving test observations & calculations...');
  const reviewAction = await req(`/reviews/projects/${newProjectId}/review`, {
    method: 'POST',
    body: {
      decision: 'APPROVED',
      comments: 'All metrological observations verify within OIML R-76-1:2006 tolerances. Approved for final issuance.'
    }
  }, reviewerToken);
  assert.strictEqual(reviewAction.data.status, 'APPROVED');
  console.log(`   [PASS] Review decision recorded: ${reviewAction.data.decision}. Status: ${reviewAction.data.status}\n`);

  // STEP 11: Login as Approver and Finalize Report
  console.log('-> STEP 11: Authenticating as Approver / Controller (approver@metrix.gov.in)...');
  const appLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: 'approver@metrix.gov.in', password: 'Approver@123' }
  });
  const approverToken = appLogin.data.token;

  console.log('-> STEP 12: Approver authorizing, permanently locking, and generating PDF/DOCX reports...');
  const finalizeRes = await req(`/reviews/projects/${newProjectId}/finalize`, {
    method: 'POST',
    body: { comments: 'Authorized by Controller of Legal Metrology (DoCA)' }
  }, approverToken);

  const reportData = finalizeRes.data;
  assert.ok(reportData.report_number);
  assert.ok(reportData.checksum_hash);
  console.log(`   [PASS] Report Issued: ${reportData.report_number}`);
  console.log(`   [PASS] SHA-256 Checksum: ${reportData.checksum_hash}`);
  console.log(`   [PASS] PDF Path: ${reportData.pdf_path}`);
  console.log(`   [PASS] DOCX Path: ${reportData.docx_path}\n`);

  // STEP 13: Verify Physical File Existence on Disk
  console.log('-> STEP 13: Verifying generated files on disk...');
  const absPdfPath = path.resolve(__dirname, '../../backend', reportData.pdf_path);
  const absDocxPath = path.resolve(__dirname, '../../backend', reportData.docx_path);
  assert.ok(fs.existsSync(absPdfPath), `PDF not found at ${absPdfPath}`);
  assert.ok(fs.existsSync(absDocxPath), `DOCX not found at ${absDocxPath}`);
  const pdfStats = fs.statSync(absPdfPath);
  const docxStats = fs.statSync(absDocxPath);
  console.log(`   [PASS] PDF File Size: ${(pdfStats.size / 1024).toFixed(1)} KB`);
  console.log(`   [PASS] DOCX File Size: ${(docxStats.size / 1024).toFixed(1)} KB\n`);

  // STEP 14: Searchable Digital Repository Query
  console.log('-> STEP 14: Verifying Searchable Digital Repository Query...');
  const repoQuery = await req(`/reports?search=${uniqueSerial}`, {}, officerToken);
  assert.ok(repoQuery.data.reports.length >= 1);
  console.log(`   [PASS] Repository located report ${repoQuery.data.reports[0].report_number} via instrument serial number '${uniqueSerial}'\n`);

  // STEP 15: Instrument-wise Test History Verification
  console.log('-> STEP 15: Verifying Instrument-wise Test History (Requirement #26)...');
  const historyQuery = await req(`/instruments/${newInstrumentId}`, {}, officerToken);
  assert.strictEqual(historyQuery.data.test_projects.length, 1);
  assert.strictEqual(historyQuery.data.reports.length, 1);
  assert.ok(historyQuery.data.audit_history.length >= 1);
  console.log(`   [PASS] Instrument test history verified with 1 project, 1 report, and full audit logs.\n`);

  console.log('================================================================');
  console.log('  GOLDEN PATH VERIFICATION COMPLETE: ALL 15 STAGES PASSED!     ');
  console.log('================================================================');
}

verifyGoldenPath().catch(err => {
  console.error('\nGOLDEN PATH VERIFICATION FAILED:', err);
  process.exit(1);
});
