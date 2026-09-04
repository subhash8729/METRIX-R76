# METRIX-R76: Live SIH 2026 Judging Demonstration Guide

**Problem Statement ID:** 26035  
**Team:** METRIX-R76  
**Organisation:** Ministry of Consumer Affairs, Food & Public Distribution (DoCA)  

---

## 1. Quick Access Credentials & One-Click Demo Switcher

The application features a **1-Click Demo Persona Switcher** located in the top navigation bar. You can switch between roles instantly without typing passwords:

| Persona | Email | Password | Role Description |
| :--- | :--- | :--- | :--- |
| **Lab Officer** | `officer@metrix.gov.in` | `Officer@123` | Tests NAWIs, records observations, runs calculations |
| **Reviewer** | `reviewer@metrix.gov.in` | `Reviewer@123` | Inspects calculations, checks limits, approves |
| **Approver** | `approver@metrix.gov.in` | `Approver@123` | Final authorization, locks project, generates reports |
| **Admin** | `admin@metrix.gov.in` | `Admin@123` | Manages OIML rule versions, drafts standards, simulator |
| **Viewer** | `viewer@metrix.gov.in` | `Viewer@123` | Read-only auditor, searches repository, downloads |

---

## 2. Recommended 7-Minute Golden Path Live Demonstration

### Stage 1: Login & Dashboard Overview (1 Minute)
1. Open `http://localhost:5173`.
2. Click **"Lab Officer"** on the quick-login card.
3. Show the Dashboard:
   - Point out real metrics loaded from MySQL (Registered NAWIs, active test projects, calibrated weights, pass/fail compliance).
   - Point out the **"Action Items Required For Your Role"** drawer.

### Stage 2: Instrument Registration & History (1.5 Minutes)
1. Click **"Instrument Registry"** in the sidebar.
2. Click **"+ Register New Instrument"**.
3. Fill in a sample balance:
   - Name: `High-Precision Pharmaceutical Scale`
   - Model: `XPR-205`
   - Serial Number: `PHARMA-2026-901`
   - Class: `Class I (Special Accuracy)`
   - Max Capacity: `220 g`, $e = 0.001\text{ g}$, $d = 0.0001\text{ g}$.
4. Click **"Complete Registration"**.
5. Click on the registered instrument to view the **Complete Instrument Lifecycle History** (past test projects, reports, attached nameplate evidence, and audit trail).

### Stage 3: Test Planning & Automated Clause Resolution (1 Minute)
1. In the instrument page, click **"Start New Test Project"**.
2. Select the rule version **`OIML-R76-2006-V1`**.
3. Click **"Initialize Test Project"**.
4. Show the judges:
   - The system **automatically resolved** the exact applicable OIML clauses (`Zero/Tare A.4.2`, `Weighing Performance A.4.4`, `Repeatability A.4.10`, `Eccentricity A.4.7`, `Discrimination A.4.8`).
   - The test matrix shows status `PENDING` and compliance `NOT_EVALUATED`.

### Stage 4: Live Observation Entry & Explainable Calculations (2 Minutes)
1. Click **"Enter / View Data"** next to **Weighing Performance (Clause A.4.4)**.
2. In the observation form, enter:
   - Test Load ($L$): `50`
   - Reading Indication ($I$): `50.000`
   - Turning Point ($\Delta L$): `0.0005`
3. Notice the **Live Automated Calculation Engine** on the right side updating in real-time:
   - Turning point: $P = I + 0.5e - \Delta L$
   - Corrected Error $E_c$
   - Permissible Error ($mpe$) automatically determined from OIML Table 6 tier
   - Pass badge displayed.
4. Click **"Explain Calculation Steps"**:
   - Show the judges the full mathematical audit trace ("Why did this result happen?").
5. Click **"Record Observation"** to commit to the MySQL database.
6. Click **"Evaluate & Complete Test"**.

### Stage 5: Review & Approval Workflow (1 Minute)
1. In the project workspace, click **"Submit for Technical Review"**.
2. Using the top navigation **Demo Persona Switcher**, click **"Reviewer"**.
3. The page updates immediately. Review the test results and click **"Complete Technical Review"** $\to$ choose **APPROVED** $\to$ submit.
4. Using the Demo Persona Switcher, switch to **"Approver"**.
5. Click the glowing **"Finalize, Lock & Issue Reports"** button.
6. The system permanently locks the project, generates both **PDF** and editable **DOCX** reports, and computes a cryptographic SHA-256 hash.

### Stage 6: Report Download & Searchable Digital Repository (30 Seconds)
1. Click **"Download PDF Report"** to view the multi-page official DoCA / OIML report.
2. Click **"Download Word (DOCX)"** to demonstrate the editable report format.
3. Open **"Report Repository"** in the sidebar:
   - Search for the instrument serial number `PHARMA-2026-901`.
   - The finalized report appears with full audit metadata.

### Stage 7: Rule Management & Simulator Innovation (30 Seconds)
1. Open **"OIML Rule Engine"** $\to$ click **"Open Rule Simulator"**.
2. Demonstrate running custom load values under different rule versions and show the judges how regulatory requirements can be updated or drafted without changing application code.
