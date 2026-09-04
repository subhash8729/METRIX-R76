# METRIX-R76: OIML R-76 NAWI Automated Compliance & Test Reporting Platform

**Smart India Hackathon 2026**  
**Problem Statement ID:** 26035  
**Organisation:** Ministry of Consumer Affairs, Food & Public Distribution  
**Department:** Department of Consumer Affairs (DoCA)  
**Standard:** OIML Recommendation R-76-1:2006 (Non-Automatic Weighing Instruments)  
**Team:** METRIX-R76  

---

## Executive Summary

**METRIX-R76** is a full-stack, enterprise-grade laboratory information and compliance system designed for the **Department of Consumer Affairs (DoCA)**. It transforms the legacy, manual NAWI verification workflow into an automated, transparent, and auditable digital journey:

$$\text{Instrument Registration} \longrightarrow \text{Test Planning} \longrightarrow \text{Digital Test Entry} \longrightarrow \text{Automated Calculations} \longrightarrow \text{OIML Compliance Evaluation} \longrightarrow \text{Review} \longrightarrow \text{Standardized PDF/DOCX Reports} \longrightarrow \text{Digital Repository}$$

---

## Key Highlights & Innovations

1. **Configurable & Versioned OIML Rule Engine**:
   - Decoupled from application code: rules, Table 6 $mpe$ limits, and clause formulas are versioned in MySQL.
   - Updates to testing standards do not break existing historical reports or require code rewrites.
2. **Authoritative Mathematical Execution**:
   - Implements OIML R-76 clauses A.4.2 (Zero/Tare), A.4.4 (Weighing Performance & turning point $P = I + 0.5e - \Delta L$), A.4.10 (Repeatability), A.4.7 (Eccentricity), and A.4.8 (Discrimination).
   - Safe expression evaluator without `eval()` or arbitrary script execution.
3. **Transparent Explainability ("Why did this result happen?")**:
   - Full mathematical audit trace showing formulas, inputs, calculated errors ($E, E_c$), permissible limits ($mpe$), and pass/fail conditions.
4. **Multi-Tier Review & Authorization Workflow**:
   - Test Officer $\to$ Technical Reviewer $\to$ Approver (Controller of Legal Metrology).
   - Tamper-evident SHA-256 checksums and record locking upon finalization.
5. **Standardized Dual-Format Reports**:
   - Vector PDF reports complete with DoCA insignia, calibration references, test tables, and digital signature blocks.
   - Editable Microsoft Word (`.docx`) reports.
6. **Instrument-Wise Test History & Digital Repository**:
   - Multi-attribute searchable archive (serial number, model, laboratory, compliance status).
   - Full lifecycle history for each weighing instrument.
7. **Interactive Rule Simulator for Judges**:
   - Run custom loads and verify compliance calculations in real-time under any rule version.

---

## Quick Start Guide

### 1. Requirements
- Node.js v18+ (tested on Node v22.14.0)
- MySQL 8.0+

### 2. Database Initialization
```bash
mysql -u root -p < database/schema/full.sql
mysql -u root -p < database/seeds/seed.sql
```

### 3. Backend Setup & Start
```bash
cd backend
npm install
npm test
node src/server.js
```
The backend starts on `http://127.0.0.1:5000`.

### 4. Frontend Setup & Start
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Demo Personas (1-Click Switcher Available in UI)

| Persona | Email | Password | Role Description |
| :--- | :--- | :--- | :--- |
| **Lab Officer** | `officer@metrix.gov.in` | `Officer@123` | Tests NAWIs, enters observations, runs calculations |
| **Reviewer** | `reviewer@metrix.gov.in` | `Reviewer@123` | Inspects calculations, checks tolerances, approves |
| **Approver** | `approver@metrix.gov.in` | `Approver@123` | Final authorization, locks records, issues reports |
| **Admin** | `admin@metrix.gov.in` | `Admin@123` | System settings, rule versions, drafts standards |
| **Viewer** | `viewer@metrix.gov.in` | `Viewer@123` | Read-only access, searches reports, downloads |

---

## Documentation Index

- [System Architecture](docs/ARCHITECTURE.md)
- [Database Schema Specification](docs/DATABASE.md)
- [REST API Reference](docs/API.md)
- [Configurable OIML Rule Engine](docs/RULE_ENGINE.md)
- [Calculation & Metrological Methodology](docs/CALCULATION_METHODOLOGY.md)
- [Deployment & Docker Guide](docs/DEPLOYMENT.md)
- [Vercel Deployment Guide](docs/VERCEL_DEPLOYMENT.md)
- [Security & Tamper Evidence](docs/SECURITY.md)
- [Live Judging Demonstration Guide](docs/DEMO_GUIDE.md)

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, TanStack Query, Lucide Icons
- **Backend**: Node.js, Express.js, MySQL2, PDFKit, docx, bcryptjs, jsonwebtoken, multer
- **Database**: MySQL 8.0 Relational Database (InnoDB)
- **Deployment**: Vercel ready (Frontend / Edge CDN), Docker & Docker Compose ready (Backend + MySQL)
