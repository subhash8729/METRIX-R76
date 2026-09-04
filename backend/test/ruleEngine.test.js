const assert = require('assert');
const { calculateMPE } = require('../src/rule-engine/mpeCalculator');
const { evaluateFormula } = require('../src/rule-engine/formulaEvaluator');
const {
  calculateTurningPoint,
  evaluateZeroSettingTest,
  evaluateWeighingPerformanceObservation,
  evaluateRepeatabilitySeries,
  evaluateEccentricityTest,
  evaluateDiscriminationTest
} = require('../src/rule-engine/nawiCalculations');

console.log('--- RUNNING METRIX-R76 RULE ENGINE AUTOMATED UNIT TESTS ---');

// Test 1: Safe Formula Evaluator
console.log('[Test 1] Safe Formula Evaluator:');
const f1 = evaluateFormula('I + 0.5 * e - delta_L', { I: 500, e: 1, delta_L: 0.2 });
assert.strictEqual(f1, 500.3);
const f2 = evaluateFormula('abs(Ec) <= mpe ? 1 : 0', { Ec: -0.4, mpe: 0.5 }); // Testing comparison & abs
assert.strictEqual(evaluateFormula('abs(x)', { x: -12.5 }), 12.5);
console.log('  -> PASS: Formula evaluation matches safe math spec.');

// Test 2: Table 6 Maximum Permissible Error (mpe) for Class I, II, III, IIII
console.log('[Test 2] OIML R-76 Table 6 mpe Calculations:');
// Class I: <= 50,000e -> 0.5e; 50,000e - 200,000e -> 1.0e; > 200,000e -> 1.5e
const mpeClass1Low = calculateMPE({ accuracyClass: 'CLASS_I', load: 20, verificationIntervalE: 0.001 }); // m/e = 20,000 <= 50,000 -> 0.5e
assert.strictEqual(mpeClass1Low.mpe_e, 0.5);
assert.strictEqual(mpeClass1Low.mpe_value, 0.0005);

const mpeClass1Mid = calculateMPE({ accuracyClass: 'CLASS_I', load: 100, verificationIntervalE: 0.001 }); // m/e = 100,000 -> 1.0e
assert.strictEqual(mpeClass1Mid.mpe_e, 1.0);
assert.strictEqual(mpeClass1Mid.mpe_value, 0.001);

const mpeClass1High = calculateMPE({ accuracyClass: 'CLASS_I', load: 210, verificationIntervalE: 0.001 }); // m/e = 210,000 -> 1.5e
assert.strictEqual(mpeClass1High.mpe_e, 1.5);

// Class III: <= 500e -> 0.5e; 500e - 2,000e -> 1.0e; 2,000e - 10,000e -> 1.5e
const mpeClass3Low = calculateMPE({ accuracyClass: 'CLASS_III', load: 2000, verificationIntervalE: 5 }); // m/e = 400 <= 500 -> 0.5e (2.5g)
assert.strictEqual(mpeClass3Low.mpe_e, 0.5);
assert.strictEqual(mpeClass3Low.mpe_value, 2.5);

const mpeClass3Mid = calculateMPE({ accuracyClass: 'CLASS_III', load: 5000, verificationIntervalE: 5 }); // m/e = 1000 <= 2000 -> 1.0e (5.0g)
assert.strictEqual(mpeClass3Mid.mpe_e, 1.0);
assert.strictEqual(mpeClass3Mid.mpe_value, 5.0);

const mpeClass3High = calculateMPE({ accuracyClass: 'CLASS_III', load: 15000, verificationIntervalE: 5 }); // m/e = 3000 <= 10000 -> 1.5e (7.5g)
assert.strictEqual(mpeClass3High.mpe_e, 1.5);
assert.strictEqual(mpeClass3High.mpe_value, 7.5);
console.log('  -> PASS: Table 6 mpe calculated accurately for Class I and Class III across all tiers.');

// Test 3: Turning Point P, Error E, Corrected Error Ec
console.log('[Test 3] Turning Point & Indication Error Calculation (Clause A.4.4):');
// Load L = 500g, Indication I = 500g, e = 0.1g, delta_L = 0.03g, zeroError E0 = 0.01g
// P = 500 + 0.5 * 0.1 - 0.03 = 500 + 0.05 - 0.03 = 500.02g
// E = P - L = 500.02 - 500 = +0.02g
// Ec = E - E0 = 0.02 - 0.01 = +0.01g
const wpTest = evaluateWeighingPerformanceObservation({
  loadApplied: 500,
  indicatedValue: 500,
  deltaLoad: 0.03,
  verificationIntervalE: 0.1,
  accuracyClass: 'CLASS_II',
  zeroError: 0.01
});
assert.strictEqual(wpTest.calculated_turning_point_P, 500.02);
assert.strictEqual(wpTest.calculated_error_E, 0.02);
assert.strictEqual(wpTest.corrected_error_Ec, 0.01);
assert.strictEqual(wpTest.status, 'PASS');
console.log('  -> PASS: Turning point P, Error E, and Corrected Error Ec computed accurately.');

// Test 4: Zero-setting and Tare Test (Clause A.4.2)
console.log('[Test 4] Zero-setting and Tare Accuracy Test (Clause A.4.2):');
// Permissible zero error: ±0.25e
// e = 0.1 -> limit = 0.025
const zeroPass = evaluateZeroSettingTest({ indicatedValue: 0, deltaLoad: 0.04, verificationIntervalE: 0.1 }); // P = 0 + 0.05 - 0.04 = 0.01 <= 0.025 -> PASS
assert.strictEqual(zeroPass.status, 'PASS');

const zeroFail = evaluateZeroSettingTest({ indicatedValue: 0, deltaLoad: 0.01, verificationIntervalE: 0.1 }); // P = 0 + 0.05 - 0.01 = 0.04 > 0.025 -> FAIL
assert.strictEqual(zeroFail.status, 'FAIL');
console.log('  -> PASS: Zero-setting tolerance evaluation enforces ±0.25e accurately.');

// Test 5: Repeatability Test (Clause A.4.10)
console.log('[Test 5] Repeatability Test (Clause A.4.10):');
// 3 weighings at 3000g, e = 0.1g, mpe = 0.100g
const repObsPass = [
  { indicated_value: 3000.0, delta_load: 0.05 }, // P = 3000.00 -> E = 0.00
  { indicated_value: 3000.0, delta_load: 0.04 }, // P = 3000.01 -> E = +0.01
  { indicated_value: 3000.0, delta_load: 0.06 }  // P = 2999.99 -> E = -0.01
];
const repResPass = evaluateRepeatabilitySeries({
  observations: repObsPass,
  loadApplied: 3000,
  verificationIntervalE: 0.1,
  accuracyClass: 'CLASS_II'
});
assert.strictEqual(repResPass.status, 'PASS');
assert.strictEqual(repResPass.errorRange, 0.02);

// Series with spread > mpe
const repObsFail = [
  { indicated_value: 3000.0, delta_load: 0.00 }, // P = 3000.05 -> E = +0.05
  { indicated_value: 2999.9, delta_load: 0.09 }  // P = 2999.86 -> E = -0.14 -> Range = 0.19 > 0.10 -> FAIL
];
const repResFail = evaluateRepeatabilitySeries({
  observations: repObsFail,
  loadApplied: 3000,
  verificationIntervalE: 0.1,
  accuracyClass: 'CLASS_II'
});
assert.strictEqual(repResFail.status, 'FAIL');
console.log('  -> PASS: Repeatability spread evaluated accurately against |mpe|.');

// Test 6: Eccentricity / Off-center loading test (Clause A.4.7)
console.log('[Test 6] Eccentricity Test (Clause A.4.7):');
const eccPositions = [
  { position: 'Center', loadApplied: 2000, indicatedValue: 2000.0, deltaLoad: 0.05 },
  { position: 'Front-Left', loadApplied: 2000, indicatedValue: 2000.0, deltaLoad: 0.04 },
  { position: 'Front-Right', loadApplied: 2000, indicatedValue: 2000.0, deltaLoad: 0.06 },
  { position: 'Rear-Left', loadApplied: 2000, indicatedValue: 2000.0, deltaLoad: 0.045 },
  { position: 'Rear-Right', loadApplied: 2000, indicatedValue: 2000.0, deltaLoad: 0.055 }
];
const eccRes = evaluateEccentricityTest({
  positionsData: eccPositions,
  verificationIntervalE: 0.1,
  accuracyClass: 'CLASS_II',
  zeroError: 0
});
assert.strictEqual(eccRes.status, 'PASS');
console.log('  -> PASS: Eccentricity positions evaluated.');

// Test 7: Discrimination Test (Clause A.4.8)
console.log('[Test 7] Discrimination Test (Clause A.4.8):');
// extra load 1.4d -> delta indication must be >= 1d
const discPass = evaluateDiscriminationTest({
  loadApplied: 3000,
  initialIndication: 3000.0,
  extraLoadApplied: 0.014,
  finalIndication: 3000.01,
  actualIntervalD: 0.01
});
assert.strictEqual(discPass.status, 'PASS');

const discFail = evaluateDiscriminationTest({
  loadApplied: 3000,
  initialIndication: 3000.0,
  extraLoadApplied: 0.014,
  finalIndication: 3000.0, // No change
  actualIntervalD: 0.01
});
assert.strictEqual(discFail.status, 'FAIL');
console.log('  -> PASS: Discrimination 1.4d requirement evaluated.');

console.log('--- ALL METRIX-R76 RULE ENGINE TESTS PASSED SUCCESSFULLY! ---');
