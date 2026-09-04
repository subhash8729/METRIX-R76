# METRIX-R76: Database Schema & Entity Documentation

**Database Engine:** MySQL 8.0 (InnoDB)  
**Database Name:** `metrix_r76`  
**Collation:** `utf8mb4_unicode_ci`

---

## 1. Schema Entity Relationship Map

The database schema contains 19 normalized relational tables:

```
[users] <----+ (assigned_officer_id, reviewer_id, approver_id)
             |
             +--------------------+
             |                    |
[manufacturers] ----+             |
                    |             |
                    v             |
              [instruments] <-----+--- [test_projects] <---+--- [reviews]
                    |                       |              |
                    v                       v              +--- [reports]
          [instrument_documents]     [test_instances] <----+
                                            |              |
                                            v              v
                                   [measurement_sets] [test_project_equipment]
                                            |                      |
                                            v                      v
                                      [observations]        [test_equipment]
                                            |
                                            v
                                 [observation_history]

[rule_standards] ---> [rule_versions] ---> [test_definitions]
[audit_logs]
[notifications]
```

---

## 2. Table Definitions & Key Fields

1. **`users`**:
   `id`, `full_name`, `email`, `password_hash`, `role` (ADMIN, LAB_OFFICER, REVIEWER, APPROVER, VIEWER), `department`, `designation`, `phone`, `is_active`.
2. **`instruments`**:
   `id`, `instrument_uid`, `name`, `model_number`, `serial_number`, `manufacturer_id`, `laboratory_id`, `accuracy_class` (CLASS_I, CLASS_II, CLASS_III, CLASS_IIII), `max_capacity`, `min_capacity`, `verification_scale_interval_e`, `actual_scale_interval_d`, `number_of_intervals_n`, `unit`, `tare_type`, `display_type`, `software_version`, `status`.
3. **`test_projects`**:
   `id`, `project_uid`, `instrument_id`, `laboratory_id`, `rule_version_id`, `assigned_officer_id`, `reviewer_id`, `approver_id`, `start_date`, `status` (DRAFT, IN_PROGRESS, TESTING_COMPLETED, UNDER_REVIEW, CHANGES_REQUESTED, APPROVED, REJECTED, FINALIZED), `overall_compliance` (PENDING, PASS, FAIL, WARNING), `environmental_conditions` (JSON).
4. **`test_instances`**:
   `id`, `project_id`, `test_definition_id`, `status` (PENDING, IN_PROGRESS, COMPLETED, SKIPPED), `compliance_result` (PASS, FAIL, WARNING, NOT_EVALUATED), `compliance_summary`.
5. **`observations`**:
   `id`, `measurement_set_id`, `load_applied`, `indicated_value`, `delta_load`, `calculated_turning_point_P`, `calculated_error_E`, `corrected_error_Ec`, `permissible_error_mpe`, `status`, `calculation_explanation` (JSON), `evidence_file`, `version_number`, `is_latest`.
6. **`observation_history`**:
   Immutable historical ledger storing prior versions of observations with `reason_for_change` and `changed_by`.
7. **`reports`**:
   `id`, `report_number`, `project_id`, `instrument_id`, `rule_version_id`, `report_version`, `status` (DRAFT, FINALIZED), `checksum_hash` (SHA-256), `pdf_path`, `docx_path`, `generated_by`, `approved_by`, `finalized_at`.
8. **`audit_logs`**:
   Immutable trail tracking `user_id`, `action`, `entity`, `entity_id`, `before_state` (JSON), `after_state` (JSON), `ip_address`, `user_agent`.
