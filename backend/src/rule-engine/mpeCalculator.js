/**
 * OIML R-76 Maximum Permissible Error (mpe) Calculator
 * Implements Table 6 (Clause 3.5.1) for Initial Verification
 * Accuracy Classes:
 *  - CLASS_I   (Special Accuracy)
 *  - CLASS_II  (High Accuracy)
 *  - CLASS_III (Medium Accuracy)
 *  - CLASS_IIII(Ordinary Accuracy)
 */

const DEFAULT_MPE_CONFIG = {
  CLASS_I: [
    { min_m_e: 0, max_m_e: 50000, mpe_e: 0.5 },
    { min_m_e: 50000, max_m_e: 200000, mpe_e: 1.0 },
    { min_m_e: 200000, max_m_e: 10000000, mpe_e: 1.5 }
  ],
  CLASS_II: [
    { min_m_e: 0, max_m_e: 5000, mpe_e: 0.5 },
    { min_m_e: 5000, max_m_e: 20000, mpe_e: 1.0 },
    { min_m_e: 20000, max_m_e: 10000000, mpe_e: 1.5 }
  ],
  CLASS_III: [
    { min_m_e: 0, max_m_e: 500, mpe_e: 0.5 },
    { min_m_e: 500, max_m_e: 2000, mpe_e: 1.0 },
    { min_m_e: 2000, max_m_e: 10000, mpe_e: 1.5 }
  ],
  CLASS_IIII: [
    { min_m_e: 0, max_m_e: 50, mpe_e: 0.5 },
    { min_m_e: 50, max_m_e: 200, mpe_e: 1.0 },
    { min_m_e: 200, max_m_e: 1000, mpe_e: 1.5 }
  ]
};

/**
 * Calculates mpe for a given load and verification scale interval e
 * @param {Object} params
 * @param {string} params.accuracyClass - CLASS_I, CLASS_II, CLASS_III, CLASS_IIII
 * @param {number} params.load - Test load applied (in instrument units)
 * @param {number} params.verificationIntervalE - e value (in instrument units)
 * @param {Object} [params.ruleConfig] - Optional configured rule table overrides
 * @returns {Object} { mpe_e, mpe_value, m_over_e, description }
 */
function calculateMPE({ accuracyClass, load, verificationIntervalE, ruleConfig = null }) {
  if (!accuracyClass || !verificationIntervalE || verificationIntervalE <= 0) {
    throw new Error('Valid accuracy class and verification scale interval (e > 0) are required for mpe calculation');
  }

  const cls = accuracyClass.toUpperCase();
  const table = (ruleConfig && ruleConfig.mpe_initial_verification && ruleConfig.mpe_initial_verification[cls])
    ? ruleConfig.mpe_initial_verification[cls]
    : DEFAULT_MPE_CONFIG[cls];

  if (!table) {
    throw new Error(`Unsupported accuracy class: ${accuracyClass}`);
  }

  // Calculate load in verification scale intervals (m/e)
  const mOverE = Math.abs(load) / verificationIntervalE;

  let matchedTier = table[table.length - 1];
  for (const tier of table) {
    if (mOverE <= tier.max_m_e) {
      matchedTier = tier;
      break;
    }
  }

  const mpe_e = matchedTier.mpe_e;
  const mpe_value = Math.round(mpe_e * verificationIntervalE * 1e6) / 1e6;

  let rangeDesc = '';
  if (cls === 'CLASS_I') {
    if (mOverE <= 50000) rangeDesc = '0 <= m <= 50,000 e (±0.5 e)';
    else if (mOverE <= 200000) rangeDesc = '50,000 e < m <= 200,000 e (±1.0 e)';
    else rangeDesc = 'm > 200,000 e (±1.5 e)';
  } else if (cls === 'CLASS_II') {
    if (mOverE <= 5000) rangeDesc = '0 <= m <= 5,000 e (±0.5 e)';
    else if (mOverE <= 20000) rangeDesc = '5,000 e < m <= 20,000 e (±1.0 e)';
    else rangeDesc = 'm > 20,000 e (±1.5 e)';
  } else if (cls === 'CLASS_III') {
    if (mOverE <= 500) rangeDesc = '0 <= m <= 500 e (±0.5 e)';
    else if (mOverE <= 2000) rangeDesc = '500 e < m <= 2,000 e (±1.0 e)';
    else rangeDesc = '2,000 e < m <= 10,000 e (±1.5 e)';
  } else if (cls === 'CLASS_IIII') {
    if (mOverE <= 50) rangeDesc = '0 <= m <= 50 e (±0.5 e)';
    else if (mOverE <= 200) rangeDesc = '50 e < m <= 200 e (±1.0 e)';
    else rangeDesc = '200 e < m <= 1,000 e (±1.5 e)';
  }

  return {
    accuracyClass: cls,
    load,
    verificationIntervalE,
    m_over_e: Math.round(mOverE * 100) / 100,
    mpe_e,
    mpe_value,
    range_description: rangeDesc
  };
}

module.exports = {
  calculateMPE,
  DEFAULT_MPE_CONFIG
};
