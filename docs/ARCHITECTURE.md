# METRIX-R76: System Architecture Specification

**Problem Statement ID:** 26035  
**Organisation:** Ministry of Consumer Affairs, Food & Public Distribution  
**Department:** Department of Consumer Affairs (DoCA)  
**Project:** METRIX-R76  

---

## 1. High-Level Architecture Overview

METRIX-R76 is built on a decoupled, layered micro-modular architecture designed to withstand regulatory audits, prevent data tampering, and ensure that changes to testing standards do not require application-wide refactors.

```
+---------------------------------------------------------------------------------------+
|                                    React 18 + Vite UI                                 |
|  - Role-based Dashboards (Admin, Lab Officer, Reviewer, Approver, Viewer)            |
|  - Instrument Registry & History | Test Project Planning & Execution Forms           |
|  - Real-time Visual Calculation & Explainability Engine ("Why did this happen?")       |
|  - Rule Management & Interactive Rule Simulator | Searchable Digital Repository       |
+-------------------------------------------+-------------------------------------------+
                                            | REST API (JWT, RBAC)
                                            v
+---------------------------------------------------------------------------------------+
|                                 Node.js / Express API                                 |
|  [Auth & RBAC Middleware] -> [Controllers] -> [Service Layer] -> [Repositories]       |
+-------------------------------------------+-------------------------------------------+
       |                                    |                                    |
       v                                    v                                    v
+-----------------------+     +--------------------------+     +------------------------+
|   OIML Rule Engine    |     |  Standardized Reports    |     |     Security & Audit   |
| - Configurable JSON   |     | - PDF Generator (PDFKit) |     | - Immutable Audit Log  |
| - Safe Math Evaluator |     | - Editable DOCX (docx)   |     | - Report Tamper-Proof  |
| - Versioned Standards |     | - DoCA & OIML Format     |     |   SHA-256 Hash & Lock  |
+-----------------------+     +--------------------------+     +------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                                MySQL 8.0 Relational DB                                |
|  Normalized Relational Schema: Instruments, Test Projects, Observations, Rules,       |
|  Calibration, Equipment, Reviews, Reports, Audit Logs, Users, Roles                   |
+---------------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Principles

### A. The "Update Rules, Not Code" Paradigm
Testing rules are decoupled from UI logic and stored as versioned entities (`rule_standards`, `rule_versions`, `test_definitions`). Published rule versions are immutable. Completed reports permanently retain the exact rule version used during testing.

### B. Authoritative Backend Calculation
While the UI provides real-time live preview feedback during observation typing, the Node.js backend remains the authoritative source of truth. Formulas are computed server-side and recorded alongside raw observations.

### C. Non-Destructive Observation Versioning
Observations are never overwritten. When an observation is modified, the previous state is preserved in `observation_history` with timestamps, author identity, and justification.

### D. Multi-Format Standardized Reports
Finalization compiles both a publication-ready vector PDF report (with DoCA emblems, headers, calibration certificates, and digital signature stamps) and an editable Microsoft Word (`.docx`) file for laboratory documentation.
