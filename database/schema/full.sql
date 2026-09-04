-- METRIX-R76 Database Schema for MySQL 8.0
-- Department of Consumer Affairs (DoCA) / OIML R-76 NAWI Compliance System
-- Problem Statement ID: 26035

CREATE DATABASE IF NOT EXISTS metrix_r76
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE metrix_r76;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS observation_history;
DROP TABLE IF EXISTS observations;
DROP TABLE IF EXISTS measurement_sets;
DROP TABLE IF EXISTS test_project_equipment;
DROP TABLE IF EXISTS test_instances;
DROP TABLE IF EXISTS test_projects;
DROP TABLE IF EXISTS test_equipment;
DROP TABLE IF EXISTS test_definitions;
DROP TABLE IF EXISTS rule_versions;
DROP TABLE IF EXISTS rule_standards;
DROP TABLE IF EXISTS instrument_documents;
DROP TABLE IF EXISTS instruments;
DROP TABLE IF EXISTS manufacturers;
DROP TABLE IF EXISTS laboratories;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users & RBAC
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'LAB_OFFICER', 'REVIEWER', 'APPROVER', 'VIEWER') NOT NULL DEFAULT 'VIEWER',
  department VARCHAR(150) DEFAULT 'Legal Metrology / RRSL',
  designation VARCHAR(150) DEFAULT 'Metrology Officer',
  phone VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- 2. Laboratories
CREATE TABLE laboratories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lab_code VARCHAR(50) NOT NULL UNIQUE,
  lab_name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  contact_person VARCHAR(150),
  contact_email VARCHAR(150),
  phone VARCHAR(50),
  accreditation_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_lab_code (lab_code)
) ENGINE=InnoDB;

-- 3. Manufacturers
CREATE TABLE manufacturers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  manufacturer_name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  address TEXT,
  country VARCHAR(100) DEFAULT 'India',
  contact_email VARCHAR(150),
  contact_phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Instruments
CREATE TABLE instruments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  instrument_uid VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  model_number VARCHAR(150) NOT NULL,
  serial_number VARCHAR(150) NOT NULL,
  manufacturer_id INT NOT NULL,
  laboratory_id INT NOT NULL,
  accuracy_class ENUM('CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII') NOT NULL,
  max_capacity DECIMAL(14, 4) NOT NULL,
  min_capacity DECIMAL(14, 4) NOT NULL,
  verification_scale_interval_e DECIMAL(14, 4) NOT NULL,
  actual_scale_interval_d DECIMAL(14, 4) NOT NULL,
  number_of_intervals_n INT NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'g',
  tare_type VARCHAR(100) DEFAULT 'Subtractive Tare',
  display_type VARCHAR(100) DEFAULT 'Digital 7-Segment LCD',
  software_version VARCHAR(100) DEFAULT 'v1.0.0',
  temperature_min DECIMAL(5, 2) DEFAULT 10.00,
  temperature_max DECIMAL(5, 2) DEFAULT 40.00,
  voltage_nominal VARCHAR(100) DEFAULT '230V AC, 50Hz',
  status ENUM('REGISTERED', 'UNDER_TEST', 'TESTED', 'DECOMMISSIONED') NOT NULL DEFAULT 'REGISTERED',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE RESTRICT,
  FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_instruments_uid (instrument_uid),
  INDEX idx_instruments_serial (serial_number),
  INDEX idx_instruments_class (accuracy_class)
) ENGINE=InnoDB;

-- 5. Instrument Documents & Evidence
CREATE TABLE instrument_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  instrument_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  document_type ENUM('NAMEPLATE', 'MANUAL', 'PHOTO', 'TECH_SPEC', 'OTHER') NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6. OIML Rule Standards
CREATE TABLE rule_standards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  standard_code VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  organization VARCHAR(100) DEFAULT 'OIML',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 7. Rule Versions
CREATE TABLE rule_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  standard_id INT NOT NULL,
  version_code VARCHAR(100) NOT NULL UNIQUE,
  release_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  changelog TEXT,
  rules_config JSON,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (standard_id) REFERENCES rule_standards(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_rule_versions_code (version_code)
) ENGINE=InnoDB;

-- 8. Test Definitions
CREATE TABLE test_definitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rule_version_id INT NOT NULL,
  test_code VARCHAR(100) NOT NULL,
  clause_reference VARCHAR(100) NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  sequence_order INT NOT NULL DEFAULT 1,
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  applicability_criteria JSON,
  formula_definition JSON,
  permissible_limit_rules JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rule_version_id) REFERENCES rule_versions(id) ON DELETE CASCADE,
  UNIQUE KEY uk_rule_test (rule_version_id, test_code)
) ENGINE=InnoDB;

-- 9. Test Equipment / Reference Standards
CREATE TABLE test_equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(150),
  model VARCHAR(150),
  serial_number VARCHAR(150),
  accuracy_class VARCHAR(50) DEFAULT 'E2',
  capacity_range VARCHAR(100),
  calibration_date DATE,
  calibration_expiry DATE,
  certificate_number VARCHAR(150),
  certificate_file VARCHAR(500),
  status ENUM('CALIBRATED', 'EXPIRING_SOON', 'EXPIRED', 'OUT_OF_SERVICE') DEFAULT 'CALIBRATED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_equipment_expiry (calibration_expiry)
) ENGINE=InnoDB;

-- 10. Test Projects (Type Evaluation Projects)
CREATE TABLE test_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_uid VARCHAR(100) NOT NULL UNIQUE,
  instrument_id INT NOT NULL,
  laboratory_id INT NOT NULL,
  rule_version_id INT NOT NULL,
  assigned_officer_id INT,
  reviewer_id INT,
  approver_id INT,
  start_date DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,
  status ENUM('DRAFT', 'IN_PROGRESS', 'TESTING_COMPLETED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'FINALIZED') NOT NULL DEFAULT 'DRAFT',
  overall_compliance ENUM('PENDING', 'PASS', 'FAIL', 'WARNING') NOT NULL DEFAULT 'PENDING',
  environmental_conditions JSON,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE RESTRICT,
  FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE RESTRICT,
  FOREIGN KEY (rule_version_id) REFERENCES rule_versions(id) ON DELETE RESTRICT,
  FOREIGN KEY (assigned_officer_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_projects_uid (project_uid),
  INDEX idx_projects_status (status)
) ENGINE=InnoDB;

-- 11. Project Equipment Linking
CREATE TABLE test_project_equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  equipment_id INT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES test_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES test_equipment(id) ON DELETE RESTRICT,
  UNIQUE KEY uk_proj_equip (project_id, equipment_id)
) ENGINE=InnoDB;

-- 12. Test Instances
CREATE TABLE test_instances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  test_definition_id INT NOT NULL,
  status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
  compliance_result ENUM('PASS', 'FAIL', 'WARNING', 'NOT_EVALUATED') NOT NULL DEFAULT 'NOT_EVALUATED',
  compliance_summary TEXT,
  calculated_at TIMESTAMP NULL,
  evaluated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES test_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (test_definition_id) REFERENCES test_definitions(id) ON DELETE RESTRICT,
  FOREIGN KEY (evaluated_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uk_proj_test (project_id, test_definition_id)
) ENGINE=InnoDB;

-- 13. Measurement Sets
CREATE TABLE measurement_sets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_instance_id INT NOT NULL,
  set_name VARCHAR(150) NOT NULL,
  load_percentage DECIMAL(5, 2),
  load_value DECIMAL(14, 4),
  unit VARCHAR(20) DEFAULT 'g',
  position VARCHAR(100) DEFAULT 'Center',
  cycle_number INT DEFAULT 1,
  tare_value DECIMAL(14, 4) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_instance_id) REFERENCES test_instances(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 14. Observations
CREATE TABLE observations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  measurement_set_id INT NOT NULL,
  sequence_number INT NOT NULL DEFAULT 1,
  load_applied DECIMAL(14, 4) NOT NULL,
  indicated_value DECIMAL(14, 4) NOT NULL,
  delta_load DECIMAL(14, 4) NOT NULL DEFAULT 0,
  calculated_turning_point_P DECIMAL(14, 4),
  calculated_error_E DECIMAL(14, 4),
  corrected_error_Ec DECIMAL(14, 4),
  permissible_error_mpe DECIMAL(14, 4),
  status ENUM('PASS', 'FAIL', 'WARNING', 'NOT_EVALUATED') NOT NULL DEFAULT 'NOT_EVALUATED',
  calculation_explanation JSON,
  evidence_file VARCHAR(500),
  notes TEXT,
  entered_by INT,
  version_number INT NOT NULL DEFAULT 1,
  is_latest BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (measurement_set_id) REFERENCES measurement_sets(id) ON DELETE CASCADE,
  FOREIGN KEY (entered_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 15. Observation History (Immutable Versioning)
CREATE TABLE observation_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  observation_id INT NOT NULL,
  measurement_set_id INT NOT NULL,
  load_applied DECIMAL(14, 4) NOT NULL,
  indicated_value DECIMAL(14, 4) NOT NULL,
  delta_load DECIMAL(14, 4) NOT NULL,
  calculated_turning_point_P DECIMAL(14, 4),
  calculated_error_E DECIMAL(14, 4),
  corrected_error_Ec DECIMAL(14, 4),
  permissible_error_mpe DECIMAL(14, 4),
  status ENUM('PASS', 'FAIL', 'WARNING', 'NOT_EVALUATED') NOT NULL,
  reason_for_change TEXT NOT NULL,
  changed_by INT,
  version_number INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (observation_id) REFERENCES observations(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 16. Reviews & Approvals
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  review_type ENUM('TECHNICAL_REVIEW', 'FINAL_APPROVAL') NOT NULL,
  decision ENUM('APPROVED', 'CHANGES_REQUESTED', 'REJECTED') NOT NULL,
  comments TEXT,
  signature_meta JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES test_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 17. Reports Repository
CREATE TABLE reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_number VARCHAR(100) NOT NULL UNIQUE,
  project_id INT NOT NULL,
  instrument_id INT NOT NULL,
  rule_version_id INT NOT NULL,
  report_version INT NOT NULL DEFAULT 1,
  status ENUM('DRAFT', 'FINALIZED') NOT NULL DEFAULT 'DRAFT',
  checksum_hash VARCHAR(100),
  pdf_path VARCHAR(500),
  docx_path VARCHAR(500),
  generated_by INT,
  approved_by INT,
  finalized_at TIMESTAMP NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES test_projects(id) ON DELETE RESTRICT,
  FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE RESTRICT,
  FOREIGN KEY (rule_version_id) REFERENCES rule_versions(id) ON DELETE RESTRICT,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_reports_num (report_number),
  INDEX idx_reports_status (status)
) ENGINE=InnoDB;

-- 18. Audit Logs (Immutable)
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100),
  before_state JSON,
  after_state JSON,
  ip_address VARCHAR(100),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_entity (entity, entity_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_user (user_id)
) ENGINE=InnoDB;

-- 19. Notifications
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('INFO', 'SUCCESS', 'WARNING', 'ALERT') NOT NULL DEFAULT 'INFO',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  related_entity VARCHAR(100),
  related_entity_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user (user_id, is_read)
) ENGINE=InnoDB;
