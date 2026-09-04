# METRIX-R76: REST API Specification

All endpoints are prefixed with `/api` and require JSON payloads unless handling multipart file uploads.

---

## 1. Authentication & Users (`/api/auth`)

- `POST /api/auth/login`: Authenticate with email & password, returns JWT token and user profile.
- `GET /api/auth/me`: Get current authenticated user profile.
- `POST /api/auth/change-password`: Update user password.
- `GET /api/auth/users`: List all laboratory users (Admin only).

---

## 2. Dashboard (`/api/dashboard`)

- `GET /api/dashboard/metrics`: Returns real-time counts, status distributions, compliance statistics, recent activities, and role-based pending actions.

---

## 3. Instruments (`/api/instruments`)

- `GET /api/instruments`: List instruments with search, class, and status filters.
- `GET /api/instruments/:id`: Get instrument by ID with full lifecycle history, past test projects, reports, and attached evidence.
- `POST /api/instruments`: Register a new NAWI instrument.
- `POST /api/instruments/:id/documents`: Upload nameplates, photos, or technical manuals.
- `GET /api/instruments/auxiliary`: Get pre-configured manufacturers and laboratory lists.

---

## 4. Test Projects (`/api/test-projects`)

- `GET /api/test-projects`: List test projects with status and search filters.
- `GET /api/test-projects/:id`: Get project details, environmental conditions, assigned equipment, test instances, and review history.
- `POST /api/test-projects`: Initialize a test project (auto-resolves applicable test clauses via the rule engine).

---

## 5. Test Execution & Observations (`/api/tests`)

- `POST /api/tests/calculate-live`: Real-time calculation preview (no database write).
- `GET /api/tests/instances/:testInstanceId`: Get test instance details, measurement sets, and observations.
- `POST /api/tests/instances/:testInstanceId/sets`: Add a test load step/position.
- `POST /api/tests/instances/:testInstanceId/sets/:measurementSetId/observations`: Save observation with automated turning point and Table 6 mpe calculation.
- `POST /api/tests/instances/:testInstanceId/evaluate`: Run test compliance evaluation.
- `POST /api/tests/observations/:observationId/evidence`: Upload observation photo evidence.

---

## 6. Review & Approval Workflow (`/api/reviews`)

- `POST /api/reviews/projects/:projectId/submit`: Submit completed tests for technical review (Officer).
- `POST /api/reviews/projects/:projectId/review`: Record technical review decision (`APPROVED`, `CHANGES_REQUESTED`, `REJECTED`) with comments (Reviewer).
- `POST /api/reviews/projects/:projectId/finalize`: Finalize, permanently lock project, and generate standardized PDF & DOCX reports with SHA-256 hash (Approver).

---

## 7. Reports Repository (`/api/reports`)

- `GET /api/reports`: Searchable repository with filters for serial number, model, status, and dates.
- `GET /api/reports/:id`: Get report metadata and checksum.
- `GET /api/reports/:id/pdf`: Download standardized vector PDF report.
- `GET /api/reports/:id/docx`: Download editable Word document report.

---

## 8. Rule Engine Administration & Simulator (`/api/rules`)

- `GET /api/rules/versions`: List rule standards, versions, and test definitions.
- `POST /api/rules/versions`: Create a draft rule revision.
- `POST /api/rules/versions/:id/publish`: Publish and activate a rule revision.
- `POST /api/rules/simulate`: Interactive simulation endpoint executing custom load and scale values.

---

## 9. Equipment & Audit Logs

- `GET /api/equipment`: List test equipment with real-time calibration expiry checks.
- `POST /api/equipment`: Add reference standard equipment.
- `GET /api/audit-logs`: Immutable audit log query with before/after state diffs.
