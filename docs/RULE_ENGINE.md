# METRIX-R76: Configurable & Versioned OIML Rule Engine

## 1. Architectural Philosophy: "Update the Rules, Not the Application"

Regulatory standards evolve over time (e.g. OIML R-76:1992, OIML R-76-1:2006, and future revisions). A traditional software system hardcodes assumptions such as tolerance tables and test procedures directly in UI handlers or database queries. When the standard changes, the entire codebase requires refactoring, risking regressions and breaking historical report integrity.

**METRIX-R76** solves this through a decoupled, multi-tier rule engine:

```
+-------------------------------------------------------------------------------+
|                             OIML Rule Definition                              |
|   (Standard: OIML R-76, Clauses: A.4.2, A.4.4, A.4.7, A.4.8, A.4.10)         |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                          Versioned Rule Package                               |
|   (e.g., 'OIML-R76-2006-V1', 'OIML-R76-2026-DRAFT')                           |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                       Instrument Applicability Matrix                         |
|   (Resolves tests based on Class I-IV, Max, Min, e, d, Tare, and Features)    |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                     Safe Mathematical Execution Engine                        |
|   (Evaluates P, E, Ec, mpe without eval() or arbitrary code execution)        |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                  Explainable Audit & Tamper-Evident Lock                      |
|   (Step-by-step mathematical trace + SHA-256 Checksum on Finalization)        |
+-------------------------------------------------------------------------------+
```

---

## 2. Rule Version Immutability & Audit Integrity

1. **Immutable Published Versions**:
   Once a rule version is published and used by any completed or finalized report, its parameters cannot be mutated.
2. **Drafting Revisions**:
   When new regulatory requirements are drafted, an Administrator creates a new draft version (e.g., `OIML-R76-2026-REV-B`).
3. **Historical Isolation**:
   Past reports remain permanently tied to the exact rule version under which they were originally evaluated. Running reports from 2024 will always use the 2024 rules, while new test projects utilize the latest active standard.

---

## 3. Mathematical Safety & Sandboxing

The rule engine prohibits arbitrary JavaScript `eval()` or string execution. Instead, mathematical calculations are processed through `src/rule-engine/formulaEvaluator.js`:
- **Lexer & Parser**: Converts expressions into a structured Abstract Syntax Tree (AST) using controlled tokens (`NUMBER`, `IDENT`, `PUNCT`, `COMP`).
- **Allowed Operations**: Addition (`+`), Subtraction (`-`), Multiplication (`*`), Division (`/`), Comparisons (`<`, `<=`, `>`, `>=`, `==`), Ternary (`? :`), and safe functions (`abs`, `min`, `max`, `round`).
- **Zero Division Protection**: Throws handled, audited validation errors without crashing the node process.

---

## 4. The Interactive Rule Simulator

To demonstrate this architecture during SIH judging, the system includes a dedicated **Rule Simulator** (`/rules/simulator`):
1. The judge or administrator selects any rule version (official standard or experimental draft).
2. The user inputs arbitrary test loads, scale intervals, and turning point deltas.
3. The engine computes the turning point, raw error, corrected error, and matches the Table 6 load tier in real time.
4. The simulator displays the step-by-step mathematical trace and explains why the decision was rendered.
