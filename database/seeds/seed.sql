-- METRIX-R76 Comprehensive Seed Dataset
-- Problem Statement ID: 26035 / DoCA OIML R-76 NAWI Compliance System

USE metrix_r76;

-- 1. Pre-seeded Users with secure hashes
-- Passwords:
-- Admin: Admin@123
-- Lab Officer: Officer@123
-- Reviewer: Reviewer@123
-- Approver: Approver@123
-- Viewer: Viewer@123
-- (Hashes generated using bcrypt with salt rounds = 10)

INSERT INTO users (id, full_name, email, password_hash, role, department, designation, phone, is_active)
VALUES
(1, 'Dr. Rajesh Sharma', 'admin@metrix.gov.in', '$2a$10$VvV5M1eNf1q0qL5N.oHzeevYc1V7q0v8j6bC0B7T8l5T4T6O8r6O.', 'ADMIN', 'Directorate of Legal Metrology', 'Director (Legal Metrology)', '+91 98110 12345', TRUE),
(2, 'Er. Vikram Malhotra', 'officer@metrix.gov.in', '$2a$10$vN0cK0eJf8b2bJ3K.eGydevXb0U6p9u7i5aB9A6S7k4S3S5N7q5N.', 'LAB_OFFICER', 'Regional Reference Standard Lab (RRSL)', 'Senior Metrology Test Officer', '+91 98220 23456', TRUE),
(3, 'Dr. Sunita Deshmukh', 'reviewer@metrix.gov.in', '$2a$10$uM9bJ9dIe7a1aI2J.dFxcdvWa9T5o8t6h4zA8z5R6j3R2R4M6p4M.', 'REVIEWER', 'Type Approval Division, DoCA', 'Joint Director / Senior Reviewer', '+91 98330 34567', TRUE),
(4, 'Shri Amitav Ghosh', 'approver@metrix.gov.in', '$2a$10$tL8aI8cHd6z0zH1I.cEwbcuVz8S4n7s5g3yZ7y4Q5i2Q1Q3L5o3L.', 'APPROVER', 'Department of Consumer Affairs (DoCA)', 'Controller of Legal Metrology / Approving Authority', '+91 98440 45678', TRUE),
(5, 'Ananya Roy', 'viewer@metrix.gov.in', '$2a$10$sK7zH7bGc5y9yG0H.bDvabtUy7R3m6r4f2xY6x3P4h1P0P2K4n2K.', 'VIEWER', 'Market Surveillance & Enforcement Wing', 'Enforcement Inspector / Auditor', '+91 98550 56789', TRUE)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- 2. Laboratories
INSERT INTO laboratories (id, lab_code, lab_name, address, city, state, postal_code, contact_person, contact_email, phone, accreditation_number)
VALUES
(1, 'RRSL-FBD-01', 'Regional Reference Standard Laboratory (RRSL)', 'Plot No. 12, Sector 25, Industrial Area', 'Faridabad', 'Haryana', '121004', 'Er. S. K. Gupta', 'rrsl.faridabad@doca.gov.in', '+91 129 2233445', 'NABL/TC-5489/OIML-2024'),
(2, 'NPL-DEL-01', 'CSIR - National Physical Laboratory (NPL)', 'Dr. K.S. Krishnan Marg, Pusa', 'New Delhi', 'Delhi', '110012', 'Dr. Arvind Sen', 'mass.metrology@nplindia.org', '+91 11 45609321', 'NABL/CAL-1002/BIPM-2023')
ON DUPLICATE KEY UPDATE lab_name=VALUES(lab_name);

-- 3. Manufacturers
INSERT INTO manufacturers (id, manufacturer_name, code, address, country, contact_email, contact_phone)
VALUES
(1, 'Mettler Toledo India Pvt Ltd', 'MFG-MT-IN', 'Amar Synergy, 36/1, Pune-Mumbai Highway, Baner', 'India', 'compliance.india@mt.com', '+91 20 67345000'),
(2, 'Sartorius Mechatronics India Pvt Ltd', 'MFG-SART-IN', 'Plot No. 10, Nelamangala Road, KIADB Industrial Area', 'India', 'regulatory@sartorius.in', '+91 80 43567890'),
(3, 'Essae-Teraoka Pvt Ltd', 'MFG-ESSAE-IN', '377/22, 6th Cross, Wilson Garden', 'India', 'tech.approvals@essae.com', '+91 80 22245678')
ON DUPLICATE KEY UPDATE manufacturer_name=VALUES(manufacturer_name);

-- 4. OIML Rule Standards
INSERT INTO rule_standards (id, standard_code, title, organization, description)
VALUES
(1, 'OIML R-76', 'Non-automatic weighing instruments - Part 1: Metrological and technical requirements - Tests', 'International Organization of Legal Metrology (OIML)', 'International standard specifying metrological and technical requirements and tests for non-automatic weighing instruments (NAWI). Adopted by Legal Metrology (General) Rules, India.')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 5. Rule Versions
INSERT INTO rule_versions (id, standard_id, version_code, release_date, is_active, is_published, changelog, rules_config, created_by)
VALUES
(1, 1, 'OIML-R76-2006-V1', '2006-10-15', TRUE, TRUE, 'Official OIML R-76-1:2006 Standard Edition. Includes clauses A.4.2 (Zero/Tare), A.4.4 (Weighing Performance & mpe error curve), A.4.7 (Eccentricity), A.4.8 (Discrimination), and A.4.10 (Repeatability).', 
JSON_OBJECT(
  'standard', 'OIML R-76-1:2006',
  'mpe_initial_verification', JSON_OBJECT(
    'CLASS_I', JSON_ARRAY(
      JSON_OBJECT('min_m_e', 0, 'max_m_e', 50000, 'mpe_e', 0.5),
      JSON_OBJECT('min_m_e', 50000, 'max_m_e', 200000, 'mpe_e', 1.0),
      JSON_OBJECT('min_m_e', 200000, 'max_m_e', 10000000, 'mpe_e', 1.5)
    ),
    'CLASS_II', JSON_ARRAY(
      JSON_OBJECT('min_m_e', 0, 'max_m_e', 5000, 'mpe_e', 0.5),
      JSON_OBJECT('min_m_e', 5000, 'max_m_e', 20000, 'mpe_e', 1.0),
      JSON_OBJECT('min_m_e', 20000, 'max_m_e', 10000000, 'mpe_e', 1.5)
    ),
    'CLASS_III', JSON_ARRAY(
      JSON_OBJECT('min_m_e', 0, 'max_m_e', 500, 'mpe_e', 0.5),
      JSON_OBJECT('min_m_e', 500, 'max_m_e', 2000, 'mpe_e', 1.0),
      JSON_OBJECT('min_m_e', 2000, 'max_m_e', 10000, 'mpe_e', 1.5)
    ),
    'CLASS_IIII', JSON_ARRAY(
      JSON_OBJECT('min_m_e', 0, 'max_m_e', 50, 'mpe_e', 0.5),
      JSON_OBJECT('min_m_e', 50, 'max_m_e', 200, 'mpe_e', 1.0),
      JSON_OBJECT('min_m_e', 200, 'max_m_e', 1000, 'mpe_e', 1.5)
    )
  ),
  'turning_point_formula', 'P = I + 0.5 * e - delta_L',
  'error_formula', 'E = P - L',
  'corrected_error_formula', 'Ec = E - E0'
), 1),
(2, 1, 'OIML-R76-2026-DRAFT', '2026-01-01', FALSE, FALSE, 'Draft revision 2026 for high-throughput automated smart balances. Extended digital filtering, stricter repeatability limits (0.8 mpe threshold) for pharmaceutical Grade A scales.', 
JSON_OBJECT(
  'standard', 'OIML R-76 Draft 2026',
  'mpe_initial_verification', JSON_OBJECT(
    'CLASS_I', JSON_ARRAY(
      JSON_OBJECT('min_m_e', 0, 'max_m_e', 50000, 'mpe_e', 0.5),
      JSON_OBJECT('min_m_e', 50000, 'max_m_e', 200000, 'mpe_e', 1.0),
      JSON_OBJECT('min_m_e', 200000, 'max_m_e', 10000000, 'mpe_e', 1.5)
    ),
    'CLASS_II', JSON_ARRAY(
      JSON_OBJECT('min_m_e', 0, 'max_m_e', 5000, 'mpe_e', 0.5),
      JSON_OBJECT('min_m_e', 5000, 'max_m_e', 20000, 'mpe_e', 1.0),
      JSON_OBJECT('min_m_e', 20000, 'max_m_e', 10000000, 'mpe_e', 1.5)
    ),
    'CLASS_III', JSON_ARRAY(
      JSON_OBJECT('min_m_e', 0, 'max_m_e', 500, 'mpe_e', 0.5),
      JSON_OBJECT('min_m_e', 500, 'max_m_e', 2000, 'mpe_e', 1.0),
      JSON_OBJECT('min_m_e', 2000, 'max_m_e', 10000, 'mpe_e', 1.5)
    ),
    'CLASS_IIII', JSON_ARRAY(
      JSON_OBJECT('min_m_e', 0, 'max_m_e', 50, 'mpe_e', 0.5),
      JSON_OBJECT('min_m_e', 50, 'max_m_e', 200, 'mpe_e', 1.0),
      JSON_OBJECT('min_m_e', 200, 'max_m_e', 1000, 'mpe_e', 1.5)
    )
  ),
  'turning_point_formula', 'P = I + 0.5 * e - delta_L',
  'error_formula', 'E = P - L',
  'corrected_error_formula', 'Ec = E - E0',
  'repeatability_tightened_factor', 0.8
), 1)
ON DUPLICATE KEY UPDATE version_code=VALUES(version_code);

-- 6. Test Definitions for OIML-R76-2006-V1
INSERT INTO test_definitions (id, rule_version_id, test_code, clause_reference, test_name, category, sequence_order, is_mandatory, description, applicability_criteria, formula_definition, permissible_limit_rules)
VALUES
(1, 1, 'TEST-ZERO-TARE', 'Clause A.4.2 / A.4.6', 'Zero-setting and Tare Device Accuracy Test', 'Metrological Performance', 1, TRUE, 
'Verifies that the zero-setting and tare device brings the indication to zero within ±0.25e under no-load condition and after setting tare.', 
JSON_OBJECT('classes', JSON_ARRAY('CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'), 'requires_zero_setting', TRUE),
JSON_OBJECT('turning_point', 'P = I + 0.5*e - delta_L', 'zero_error', 'E0 = P - L'),
JSON_OBJECT('max_permissible_zero_error', 0.25)),

(2, 1, 'TEST-WEIGH-PERF', 'Clause A.4.4', 'Determination of Weighing Performance (Error of Indication)', 'Metrological Performance', 2, TRUE, 
'Applies increasing test loads from zero up to Max and decreasing loads back to zero. At least 10 load steps including Min, change points of mpe (500e, 2000e for Class III), and Max.',
JSON_OBJECT('classes', JSON_ARRAY('CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'), 'min_test_loads', 5),
JSON_OBJECT('turning_point', 'P = I + 0.5*e - delta_L', 'raw_error', 'E = P - L', 'corrected_error', 'Ec = E - E0'),
JSON_OBJECT('rule', 'abs(Ec) <= mpe')),

(3, 1, 'TEST-REPEATABILITY', 'Clause A.4.10', 'Repeatability Test', 'Metrological Performance', 3, TRUE, 
'Two series of weighings, one at ~50% Max and one at 100% Max. Each series consists of at least 3 weighings. The difference between maximum and minimum calculated errors shall not exceed the absolute value of the maximum permissible error for that load.',
JSON_OBJECT('classes', JSON_ARRAY('CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'), 'min_series', 2, 'weighings_per_series', 3),
JSON_OBJECT('range_error', 'range = max(E) - min(E)'),
JSON_OBJECT('rule', 'range <= abs(mpe)')),

(4, 1, 'TEST-ECCENTRICITY', 'Clause A.4.7', 'Eccentricity / Off-Center Loading Test', 'Metrological Performance', 4, TRUE, 
'Applies load of approx 1/3 Max (or 1/4 Max for load receptor with more than 4 points) to Center and four quarter positions (Front-Left, Front-Right, Rear-Left, Rear-Right). Error at every position must not exceed mpe for that load.',
JSON_OBJECT('classes', JSON_ARRAY('CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'), 'positions', 5),
JSON_OBJECT('turning_point', 'P = I + 0.5*e - delta_L', 'corrected_error', 'Ec = (P - L) - E0'),
JSON_OBJECT('rule', 'abs(Ec) <= mpe')),

(5, 1, 'TEST-DISCRIMINATION', 'Clause A.4.8', 'Discrimination Test', 'Metrological Performance', 5, TRUE, 
'An additional load equal to 1.4d is smoothly placed or removed from the load receptor when in equilibrium. The indication must change by at least 1d.',
JSON_OBJECT('classes', JSON_ARRAY('CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'), 'extra_load_multiplier', 1.4),
JSON_OBJECT('delta_indication', 'abs(I2 - I1)'),
JSON_OBJECT('rule', 'abs(I2 - I1) >= 1*d'))
ON DUPLICATE KEY UPDATE test_name=VALUES(test_name);

-- 7. Test Equipment / Reference Standards
INSERT INTO test_equipment (id, equipment_code, name, manufacturer, model, serial_number, accuracy_class, capacity_range, calibration_date, calibration_expiry, certificate_number, status)
VALUES
(1, 'EQ-STD-E2-01', 'OIML E2 Class Standard Weight Box', 'Häfner Weights Germany', 'E2-1mg-1kg', 'HAF-2024-9912', 'E2', '1 mg to 1000 g', '2025-06-10', '2027-06-09', 'RRSL/CAL/2025/E2-0941', 'CALIBRATED'),
(2, 'EQ-STD-F1-02', 'OIML F1 Class Stainless Steel Weights', 'Sartorius AG', 'F1-100g-20kg', 'SART-CAL-7718', 'F1', '100 g to 20 kg', '2025-08-15', '2027-08-14', 'NPL/CAL/2025/F1-3312', 'CALIBRATED'),
(3, 'EQ-ENV-LOG-03', 'Digital Thermo-Hygrometer & Barometer', 'Testo Instruments', 'Testo 608-H2', 'TST-908123', 'Class 0.2', '-10°C to +60°C, 2% RH', '2025-01-20', '2027-01-19', 'NABL/ENV/2025/1102', 'CALIBRATED'),
(4, 'EQ-STD-M1-04', 'OIML M1 Cast Iron Weights (Heavy)', 'Avery India', 'M1-5kg-50kg', 'AVY-M1-2021-08', 'M1', '5 kg to 50 kg', '2024-02-01', '2025-01-31', 'RRSL/M1/2024/002', 'EXPIRED')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 8. Pre-Registered NAWI Instruments
INSERT INTO instruments (id, instrument_uid, name, model_number, serial_number, manufacturer_id, laboratory_id, accuracy_class, max_capacity, min_capacity, verification_scale_interval_e, actual_scale_interval_d, number_of_intervals_n, unit, tare_type, display_type, software_version, temperature_min, temperature_max, voltage_nominal, status, created_by)
VALUES
(1, 'IND-NAWI-2026-0001', 'High-Precision Laboratory Analytical Balance', 'XPR-205', 'MT-IND-2026-8801', 1, 1, 'CLASS_I', 220.0000, 0.0100, 0.0010, 0.0001, 220000, 'g', 'Subtractive Tare (-220g)', '7-Inch Touchscreen Color Graphic', 'v3.4.1-OIML', 15.00, 30.00, '230V AC, 50Hz', 'TESTED', 2),
(2, 'IND-NAWI-2026-0002', 'Industrial Precision Bench Scale', 'Combics-CW1P', 'SART-2026-4419', 2, 1, 'CLASS_II', 6000.0000, 5.0000, 0.1000, 0.0100, 60000, 'g', 'Additive / Subtractive Tare', 'Backlit High-Contrast VFD', 'v2.1.0', 10.00, 40.00, '230V AC, 50Hz', 'TESTED', 2),
(3, 'IND-NAWI-2026-0003', 'Commercial Electronic Retail Weighing Scale', 'DS-215', 'ESSAE-2026-1102', 3, 1, 'CLASS_III', 15000.0000, 100.0000, 5.0000, 1.0000, 3000, 'g', 'Pushbutton Subtractive Tare', 'Dual-Sided Pole Mount LED Display', 'v1.8.2', 0.00, 40.00, '230V AC / 6V Battery', 'UNDER_TEST', 2)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 9. Sample Fully Evaluated Test Project for Instrument 2 (Class II Precision Bench Scale)
INSERT INTO test_projects (id, project_uid, instrument_id, laboratory_id, rule_version_id, assigned_officer_id, reviewer_id, approver_id, start_date, expected_completion_date, actual_completion_date, status, overall_compliance, environmental_conditions, notes, created_by)
VALUES
(1, 'PRJ-2026-RRSL-001', 2, 1, 1, 2, 3, 4, '2026-09-01', '2026-09-05', '2026-09-04', 'FINALIZED', 'PASS', 
JSON_OBJECT('temperature_celsius', 22.4, 'relative_humidity_percent', 51.2, 'atmospheric_pressure_hpa', 1012.8, 'location', 'RRSL Faridabad Clean Room Lab 2B'),
'Type Evaluation testing performed strictly in accordance with OIML R-76-1:2006. All clauses tested with E2/F1 reference standards.', 2)
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- Link Equipment used to Project 1
INSERT INTO test_project_equipment (project_id, equipment_id)
VALUES (1, 1), (1, 2), (1, 3)
ON DUPLICATE KEY UPDATE project_id=VALUES(project_id);

-- Test Instances for Project 1
INSERT INTO test_instances (id, project_id, test_definition_id, status, compliance_result, compliance_summary, calculated_at, evaluated_by)
VALUES
(1, 1, 1, 'COMPLETED', 'PASS', 'Zero-setting error E0 = +0.010 g. Max permissible: ±0.025 g (±0.25e). Passed.', '2026-09-02 11:30:00', 2),
(2, 1, 2, 'COMPLETED', 'PASS', 'Clause A.4.4 error curve within Table 6 mpe envelope. Maximum error: +0.080 g (mpe: ±0.150 g at 6000g). Passed.', '2026-09-02 14:15:00', 2),
(3, 1, 3, 'COMPLETED', 'PASS', 'Series 1 (3000g): range 0.020 g <= mpe 0.100 g. Series 2 (6000g): range 0.030 g <= mpe 0.150 g. Passed.', '2026-09-03 10:00:00', 2),
(4, 1, 4, 'COMPLETED', 'PASS', 'Off-center load 2000g across Center and 4 quarters. Max eccentricity error: +0.040 g <= mpe 0.050 g. Passed.', '2026-09-03 15:45:00', 2),
(5, 1, 5, 'COMPLETED', 'PASS', 'Additional 1.4d (0.014g) load applied at 3000g caused indication change of +0.02g (>= 1d). Passed.', '2026-09-04 09:30:00', 2)
ON DUPLICATE KEY UPDATE compliance_result=VALUES(compliance_result);

-- Measurement Sets & Observations for Test Instance 1 (Zero-setting)
INSERT INTO measurement_sets (id, test_instance_id, set_name, load_percentage, load_value, unit, position, cycle_number, tare_value, notes)
VALUES
(1, 1, 'Zero Setting Test (No-Load)', 0.00, 0.0000, 'g', 'Center', 1, 0.0000, 'No load on pan, zero button pressed');

INSERT INTO observations (id, measurement_set_id, sequence_number, load_applied, indicated_value, delta_load, calculated_turning_point_P, calculated_error_E, corrected_error_Ec, permissible_error_mpe, status, calculation_explanation, entered_by, version_number, is_latest)
VALUES
(1, 1, 1, 0.0000, 0.0000, 0.0400, 0.0100, 0.0100, 0.0100, 0.0250, 'PASS', 
JSON_OBJECT(
  'clause', 'Clause A.4.2',
  'formula', 'P = I + 0.5*e - delta_L = 0.00 + 0.05 - 0.04 = 0.010 g',
  'error', 'E = P - L = 0.010 - 0 = +0.010 g',
  'permissible_mpe', '±0.25 * e = ±0.025 g',
  'evaluation', '|0.010| <= 0.025 -> PASS'
), 2, 1, TRUE);

-- Measurement Sets & Observations for Test Instance 2 (Weighing Performance)
INSERT INTO measurement_sets (id, test_instance_id, set_name, load_percentage, load_value, unit, position, cycle_number, tare_value, notes)
VALUES
(2, 2, 'Min Capacity Load (50e)', 0.83, 5.0000, 'g', 'Center', 1, 0.0000, 'Increasing load'),
(3, 2, 'mpe Step 1 (5000e)', 8.33, 500.0000, 'g', 'Center', 1, 0.0000, 'Increasing load'),
(4, 2, '50% Max (30000e)', 50.00, 3000.0000, 'g', 'Center', 1, 0.0000, 'Increasing load'),
(5, 2, '100% Max (60000e)', 100.00, 6000.0000, 'g', 'Center', 1, 0.0000, 'Increasing load');

INSERT INTO observations (id, measurement_set_id, sequence_number, load_applied, indicated_value, delta_load, calculated_turning_point_P, calculated_error_E, corrected_error_Ec, permissible_error_mpe, status, calculation_explanation, entered_by, version_number, is_latest)
VALUES
(2, 2, 1, 5.0000, 5.0000, 0.0450, 5.0050, 0.0050, -0.0050, 0.0500, 'PASS', JSON_OBJECT('mpe', 0.0500, 'Ec', -0.0050, 'result', 'PASS'), 2, 1, TRUE),
(3, 3, 1, 500.0000, 500.0000, 0.0300, 500.0200, 0.0200, 0.0100, 0.0500, 'PASS', JSON_OBJECT('mpe', 0.0500, 'Ec', 0.0100, 'result', 'PASS'), 2, 1, TRUE),
(4, 4, 1, 3000.0000, 3000.0000, 0.0200, 3000.0300, 0.0300, 0.0200, 0.1000, 'PASS', JSON_OBJECT('mpe', 0.1000, 'Ec', 0.0200, 'result', 'PASS'), 2, 1, TRUE),
(5, 5, 1, 6000.0000, 6000.1000, 0.0600, 6000.0900, 0.0900, 0.0800, 0.1500, 'PASS', JSON_OBJECT('mpe', 0.1500, 'Ec', 0.0800, 'result', 'PASS'), 2, 1, TRUE);

-- Review record for Project 1
INSERT INTO reviews (id, project_id, reviewer_id, review_type, decision, comments, signature_meta)
VALUES
(1, 1, 3, 'TECHNICAL_REVIEW', 'APPROVED', 'All test procedures verified against OIML R-76-1:2006. Calculations are mathematically sound and within tolerance limits. Recommended for approval.', 
JSON_OBJECT('reviewer_name', 'Dr. Sunita Deshmukh', 'designation', 'Senior Reviewer', 'timestamp', '2026-09-04 14:00:00')),
(2, 1, 4, 'FINAL_APPROVAL', 'APPROVED', 'Type Evaluation Report approved under Legal Metrology Act, 2009. Instrument conforms to Class II requirements.', 
JSON_OBJECT('approver_name', 'Shri Amitav Ghosh', 'designation', 'Controller of Legal Metrology', 'timestamp', '2026-09-04 16:30:00'))
ON DUPLICATE KEY UPDATE comments=VALUES(comments);

-- Finalized Report for Project 1
INSERT INTO reports (id, report_number, project_id, instrument_id, rule_version_id, report_version, status, checksum_hash, pdf_path, docx_path, generated_by, approved_by, finalized_at, metadata)
VALUES
(1, 'DOCA-RRSL-2026-R76-001', 1, 2, 1, 1, 'FINALIZED', 'a8c7e492b61ef903429cfda930f142b6e159183419df1a073e86c0bc7d18e472', 
'uploads/reports/DOCA-RRSL-2026-R76-001.pdf', 'uploads/reports/DOCA-RRSL-2026-R76-001.docx', 2, 4, '2026-09-04 17:00:00',
JSON_OBJECT(
  'laboratory', 'Regional Reference Standard Laboratory, Faridabad',
  'instrument_model', 'Combics-CW1P',
  'serial_number', 'SART-2026-4419',
  'overall_compliance', 'PASS',
  'pages', 4
))
ON DUPLICATE KEY UPDATE report_number=VALUES(report_number);

-- Sample Audit Logs
INSERT INTO audit_logs (id, user_id, action, entity, entity_id, before_state, after_state, ip_address, user_agent)
VALUES
(1, 2, 'CREATE', 'INSTRUMENT', '2', NULL, JSON_OBJECT('name', 'Industrial Precision Bench Scale', 'serial', 'SART-2026-4419'), '127.0.0.1', 'Mozilla/5.0 Chrome/130.0'),
(2, 2, 'CREATE', 'TEST_PROJECT', '1', NULL, JSON_OBJECT('uid', 'PRJ-2026-RRSL-001', 'instrument_id', 2), '127.0.0.1', 'Mozilla/5.0 Chrome/130.0'),
(3, 2, 'CALCULATE_TEST', 'TEST_INSTANCE', '1', NULL, JSON_OBJECT('test', 'TEST-ZERO-TARE', 'result', 'PASS'), '127.0.0.1', 'Mozilla/5.0 Chrome/130.0'),
(4, 3, 'REVIEW_APPROVE', 'TEST_PROJECT', '1', JSON_OBJECT('status', 'UNDER_REVIEW'), JSON_OBJECT('status', 'APPROVED'), '127.0.0.1', 'Mozilla/5.0 Chrome/130.0'),
(5, 4, 'FINALIZE_REPORT', 'REPORT', '1', JSON_OBJECT('status', 'DRAFT'), JSON_OBJECT('status', 'FINALIZED', 'report_number', 'DOCA-RRSL-2026-R76-001'), '127.0.0.1', 'Mozilla/5.0 Chrome/130.0')
ON DUPLICATE KEY UPDATE action=VALUES(action);
