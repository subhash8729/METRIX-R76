# METRIX-R76: Security & Data Integrity Architecture

---

## 1. Authentication & Session Security

- **Password Storage**: Passwords are never stored in plaintext. They are hashed using `bcryptjs` with an adaptive work factor of 10 salt rounds.
- **Stateless Tokens**: JWTs are signed with a cryptographically secure HMAC secret and carry expiration timestamps.
- **Account Verification**: On every authenticated request, the database is checked to ensure the user account is active and has not been revoked.

---

## 2. Role-Based Access Control (RBAC)

RBAC is enforced strictly on the backend across all API endpoints:
- **`ADMIN`**: User management, system settings, rule version drafting & publishing.
- **`LAB_OFFICER`**: Registering instruments, creating test projects, entering observations, uploading evidence, initiating reviews.
- **`REVIEWER`**: Inspecting observations, checking calculation steps, approving or requesting revisions.
- **`APPROVER`**: Final legal authorization, record locking, generating tamper-evident PDF/DOCX reports.
- **`VIEWER`**: Read-only repository access and report downloads.

---

## 3. SQL Injection & Parameter Sanitization

All queries utilize prepared statements (`mysql2` parameterized queries with `?` placeholders). No string concatenation or raw user input is ever passed to the SQL interpreter.

---

## 4. File Upload Safety

- **MIME & Extension Whitelisting**: Restricted to `.jpg`, `.jpeg`, `.png`, `.pdf`, `.docx`, and `.webp`. Executable extensions are rejected.
- **Filename Sanitization**: Uploaded files are stripped of special characters, assigned randomized millisecond suffixes, and stored in dedicated subdirectories (`uploads/documents`, `uploads/evidence`, `uploads/reports`).
- **File Size Limits**: Capped at 15MB to prevent memory exhaustion and Denial of Service.

---

## 5. Report Tamper Evident Integrity

When an Approver finalizes a test report:
1. The project record status transitions to `FINALIZED`, preventing further updates.
2. The report binary generates a SHA-256 cryptographic hash.
3. The hash is stamped on the footer of every page of the PDF report and permanently recorded in the MySQL database.
4. Any manual modification to the file can be immediately detected via checksum verification.
