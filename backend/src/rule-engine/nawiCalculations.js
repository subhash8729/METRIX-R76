const { calculateMPE } = require('./mpeCalculator');
const { evaluateFormula } = require('./formulaEvaluator');

/**
 * Calculates turning point load P as per OIML R-76 clause A.4.4.3:
 * P = I + 0.5*e - delta_L
 */
function calculateTurningPoint({ indicatedValue, deltaLoad, verificationIntervalE }) {
  const I = Number(indicatedValue);
  const deltaL = Number(deltaLoad) || 0;
  const e = Number(verificationIntervalE);

  const P = I + 0.5 * e - deltaL;
  return Math.round(P * 1e6) / 1e6;
}

/**
 * Evaluates Zero-Setting / Tare Accuracy Test (Clause A.4.2 / A.4.6)
 * Max permissible zero error: ±0.25e
 */
function evaluateZeroSettingTest({ indicatedValue, deltaLoad, verificationIntervalE }) {
  const e = Number(verificationIntervalE);
  const P = calculateTurningPoint({ indicatedValue, deltaLoad, verificationIntervalE: e });
  const E0 = P - 0; // Load is 0
  const maxPermissibleZeroError = 0.25 * e;
  const isPass = Math.abs(E0) <= maxPermissibleZeroError + 1e-9;

  return {
    testCode: 'TEST-ZERO-TARE',
    clause: 'Clause A.4.2 / A.4.6',
    calculated_turning_point_P: P,
    calculated_error_E: E0,
    corrected_error_Ec: E0,
    permissible_error_mpe: maxPermissibleZeroError,
    status: isPass ? 'PASS' : 'FAIL',
    explanation: {
      formula: 'P = I + 0.5 * e - delta_L',
      steps: [
        `Indication I = ${indicatedValue}, delta_L = ${deltaLoad}, e = ${e}`,
        `Calculated Turning Point P = ${indicatedValue} + (0.5 * ${e}) - ${deltaLoad} = ${P}`,
        `Zero Error E0 = P - L = ${P} - 0 = ${E0}`,
        `Maximum Permissible Zero Error = ±0.25 * e = ±${maxPermissibleZeroError}`
      ],
      condition: `|E0| (${Math.abs(E0)}) <= ${maxPermissibleZeroError}`,
      result: isPass ? 'PASS' : 'FAIL'
    }
  };
}

/**
 * Evaluates Weighing Performance / Error of Indication observation (Clause A.4.4)
 * P = I + 0.5*e - delta_L
 * E = P - L
 * Ec = E - E0
 * Pass if |Ec| <= mpe
 */
function evaluateWeighingPerformanceObservation({
  loadApplied,
  indicatedValue,
  deltaLoad,
  verificationIntervalE,
  accuracyClass,
  zeroError = 0,
  ruleConfig = null
}) {
  const L = Number(loadApplied);
  const I = Number(indicatedValue);
  const deltaL = Number(deltaLoad) || 0;
  const e = Number(verificationIntervalE);
  const E0 = Number(zeroError) || 0;

  const P = calculateTurningPoint({ indicatedValue: I, deltaLoad: deltaL, verificationIntervalE: e });
  const E = Math.round((P - L) * 1e6) / 1e6;
  const Ec = Math.round((E - E0) * 1e6) / 1e6;

  const mpeResult = calculateMPE({
    accuracyClass,
    load: L,
    verificationIntervalE: e,
    ruleConfig
  });

  const isPass = Math.abs(Ec) <= mpeResult.mpe_value + 1e-9;

  return {
    load_applied: L,
    indicated_value: I,
    delta_load: deltaL,
    calculated_turning_point_P: P,
    calculated_error_E: E,
    corrected_error_Ec: Ec,
    permissible_error_mpe: mpeResult.mpe_value,
    status: isPass ? 'PASS' : 'FAIL',
    mpe_details: mpeResult,
    explanation: {
      formula: 'P = I + 0.5*e - delta_L; E = P - L; Ec = E - E0',
      steps: [
        `Load L = ${L}, Indication I = ${I}, delta_L = ${deltaL}, e = ${e}, E0 = ${E0}`,
        `Turning Point P = ${I} + 0.5 * ${e} - ${deltaL} = ${P}`,
        `Raw Error E = P - L = ${P} - ${L} = ${E}`,
        `Corrected Error Ec = E - E0 = ${E} - (${E0}) = ${Ec}`,
        `Load in intervals m/e = ${mpeResult.m_over_e} (${mpeResult.range_description})`,
        `Maximum Permissible Error (mpe) = ±${mpeResult.mpe_value} (±${mpeResult.mpe_e} e)`
      ],
      condition: `|Ec| (${Math.abs(Ec)}) <= mpe (${mpeResult.mpe_value})`,
      result: isPass ? 'PASS' : 'FAIL'
    }
  };
}

/**
 * Evaluates Repeatability Test (Clause A.4.10)
 * Evaluates a series of weighings at the same load.
 * Pass if (max(E) - min(E)) <= |mpe|
 */
function evaluateRepeatabilitySeries({
  observations,
  loadApplied,
  verificationIntervalE,
  accuracyClass,
  ruleConfig = null
}) {
  if (!observations || observations.length < 2) {
    return {
      status: 'NOT_EVALUATED',
      reason: 'At least 2 repeated weighings required for repeatability evaluation'
    };
  }

  const e = Number(verificationIntervalE);
  const L = Number(loadApplied);

  const errors = observations.map(obs => {
    const P = calculateTurningPoint({
      indicatedValue: obs.indicated_value,
      deltaLoad: obs.delta_load,
      verificationIntervalE: e
    });
    return Math.round((P - L) * 1e6) / 1e6;
  });

  const maxE = Math.max(...errors);
  const minE = Math.min(...errors);
  const errorRange = Math.round((maxE - minE) * 1e6) / 1e6;

  const mpeResult = calculateMPE({
    accuracyClass,
    load: L,
    verificationIntervalE: e,
    ruleConfig
  });

  // Check if draft rule specifies tightened repeatability factor (e.g. 0.8 * mpe)
  const factor = (ruleConfig && ruleConfig.repeatability_tightened_factor) || 1.0;
  const allowableLimit = Math.round(mpeResult.mpe_value * factor * 1e6) / 1e6;
  const isPass = errorRange <= allowableLimit + 1e-9;

  return {
    testCode: 'TEST-REPEATABILITY',
    clause: 'Clause A.4.10',
    loadApplied: L,
    count: observations.length,
    errors,
    maxError: maxE,
    minError: minE,
    errorRange,
    allowableLimit,
    status: isPass ? 'PASS' : 'FAIL',
    explanation: {
      formula: 'Range = max(E) - min(E) <= |mpe|',
      steps: [
        `Test Load = ${L}, Verification Interval e = ${e}`,
        `Recorded Error values: [${errors.join(', ')}]`,
        `Max Error = ${maxE}, Min Error = ${minE}`,
        `Error Range (Repeatability spread) = ${maxE} - (${minE}) = ${errorRange}`,
        `Allowable Limit = |mpe| (${allowableLimit})`
      ],
      condition: `Range (${errorRange}) <= Allowable Limit (${allowableLimit})`,
      result: isPass ? 'PASS' : 'FAIL'
    }
  };
}

/**
 * Evaluates Eccentricity / Off-Center Loading Test (Clause A.4.7)
 * Evaluates 5 positions (Center, Front-Left, Front-Right, Rear-Left, Rear-Right)
 * Pass if every position |Ec| <= mpe
 */
function evaluateEccentricityTest({
  positionsData, // Array of { position, loadApplied, indicatedValue, deltaLoad }
  verificationIntervalE,
  accuracyClass,
  zeroError = 0,
  ruleConfig = null
}) {
  const results = positionsData.map(pos => {
    return {
      position: pos.position,
      ...evaluateWeighingPerformanceObservation({
        loadApplied: pos.loadApplied,
        indicatedValue: pos.indicatedValue,
        deltaLoad: pos.deltaLoad,
        verificationIntervalE,
        accuracyClass,
        zeroError,
        ruleConfig
      })
    };
  });

  const hasFail = results.some(r => r.status === 'FAIL');
  const maxAbsEc = Math.max(...results.map(r => Math.abs(r.corrected_error_Ec)));
  const allowableMpe = results[0]?.permissible_error_mpe || 0;

  return {
    testCode: 'TEST-ECCENTRICITY',
    clause: 'Clause A.4.7',
    positionsResults: results,
    maxAbsEc,
    allowableMpe,
    status: hasFail ? 'FAIL' : 'PASS',
    explanation: {
      formula: 'For every position i in [Center, FL, FR, RL, RR]: |Ec_i| <= mpe',
      steps: results.map(r => `Position ${r.position}: Indication=${r.indicated_value}, Ec=${r.corrected_error_Ec}, mpe=±${r.permissible_error_mpe} -> ${r.status}`),
      condition: `Max |Ec| (${maxAbsEc}) <= mpe (${allowableMpe})`,
      result: hasFail ? 'FAIL' : 'PASS'
    }
  };
}

/**
 * Evaluates Discrimination Test (Clause A.4.8)
 * Initial indication I1, extra load 1.4d applied -> indication I2
 * Difference |I2 - I1| >= 1d
 */
function evaluateDiscriminationTest({
  loadApplied,
  initialIndication,
  extraLoadApplied,
  finalIndication,
  actualIntervalD
}) {
  const d = Number(actualIntervalD);
  const I1 = Number(initialIndication);
  const I2 = Number(finalIndication);
  const deltaIndication = Math.round(Math.abs(I2 - I1) * 1e6) / 1e6;

  const requiredChange = d;
  const isPass = deltaIndication >= requiredChange - 1e-9;

  return {
    testCode: 'TEST-DISCRIMINATION',
    clause: 'Clause A.4.8',
    loadApplied,
    initialIndication: I1,
    extraLoadApplied,
    finalIndication: I2,
    deltaIndication,
    requiredChange,
    status: isPass ? 'PASS' : 'FAIL',
    explanation: {
      formula: 'Extra load 1.4d applied smoothly -> |I2 - I1| >= 1d',
      steps: [
        `Base load = ${loadApplied}, actual scale interval d = ${d}`,
        `Extra load applied = ${extraLoadApplied} (approx 1.4 * d)`,
        `Initial Indication I1 = ${I1}, Final Indication I2 = ${I2}`,
        `Indication change |I2 - I1| = |${I2} - ${I1}| = ${deltaIndication}`
      ],
      condition: `Indication Change (${deltaIndication}) >= 1d (${requiredChange})`,
      result: isPass ? 'PASS' : 'FAIL'
    }
  };
}

module.exports = {
  calculateTurningPoint,
  evaluateZeroSettingTest,
  evaluateWeighingPerformanceObservation,
  evaluateRepeatabilitySeries,
  evaluateEccentricityTest,
  evaluateDiscriminationTest
};
