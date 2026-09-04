# METRIX-R76: Mathematical Calculation & Compliance Methodology

**Problem Statement ID:** 26035  
**Organisation:** Ministry of Consumer Affairs, Food & Public Distribution  
**Department:** Department of Consumer Affairs (DoCA)  
**Standard:** OIML Recommendation R-76-1:2006 (Non-Automatic Weighing Instruments - NAWI)

---

## 1. Overview

Under manual inspection regimes, verification officers observe digital readings, place change-point decimal weights, and manually subtract tare or initial zero-load offsets. This manual process introduces transcription errors, rounding differences, and potential regulatory disputes.

**METRIX-R76** eliminates manual calculations by implementing the authoritative metrological formulas defined in OIML R-76-1:2006 directly within a sandboxed, versioned mathematical engine.

---

## 2. Determination of Indication & Turning Point (Clause A.4.4.3)

For instruments with digital indication and scale interval $d$, the indication $I$ may mask rounding up to $\pm 0.5d$. To determine the precise indication prior to rounding, small additional weights (fractional weights $\Delta L$) are placed smoothly until the displayed value changes to the next higher increment:

$$P = I + \frac{1}{2}e - \Delta L$$

Where:
- $P$ = Actual calculated indication / turning point
- $I$ = Displayed indication on the instrument
- $e$ = Verification scale interval
- $\Delta L$ = Sum of additional weights added to reach the next turning point

---

## 3. Error of Indication & Corrected Error (Clause A.4.4.3 & A.4.2)

### A. Raw Error ($E$)
The raw error before zero-load correction is calculated as:
$$E = P - L = \left(I + \frac{1}{2}e - \Delta L\right) - L$$

Where $L$ is the reference test load placed on the load receptor.

### B. Zero-Setting Error ($E_0$)
At zero load ($L = 0$), the turning point load determines $E_0$:
$$E_0 = P_0 - 0 = I_0 + \frac{1}{2}e - \Delta L_0$$
As per Clause A.4.2.3, the zero-setting device must bring the indication to zero within:
$$|E_0| \le 0.25e$$

### C. Corrected Error of Indication ($E_c$)
The corrected error eliminates the initial zero error:
$$E_c = E - E_0$$

The compliance condition for every test load $L$ is:
$$|E_c| \le mpe$$

---

## 4. Maximum Permissible Error ($mpe$) by Accuracy Class (Table 6)

The Maximum Permissible Error ($mpe$) for initial verification is determined as a step function of the load $m$ expressed in verification scale intervals ($m/e$):

| Accuracy Class | Tier 1: $mpe = \pm 0.5e$ | Tier 2: $mpe = \pm 1.0e$ | Tier 3: $mpe = \pm 1.5e$ |
| :--- | :--- | :--- | :--- |
| **Class I** | $0 \le m \le 50\,000\,e$ | $50\,000\,e < m \le 200\,000\,e$ | $m > 200\,000\,e$ |
| **Class II** | $0 \le m \le 5\,000\,e$ | $5\,000\,e < m \le 20\,000\,e$ | $m > 20\,000\,e$ |
| **Class III** | $0 \le m \le 500\,e$ | $500\,e < m \le 2\,000\,e$ | $2\,000\,e < m \le 10\,000\,e$ |
| **Class IIII** | $0 \le m \le 50\,e$ | $50\,e < m \le 200\,e$ | $200\,e < m \le 1\,000\,e$ |

---

## 5. Metrological Clause Testing Workflows

### 1. Zero-Setting & Tare Device Accuracy (Clause A.4.2 / A.4.6)
- Evaluates no-load zeroing and tare subtraction.
- Condition: $|E_0| \le 0.25e$.

### 2. Weighing Performance Test (Clause A.4.4)
- At least 10 load steps applied sequentially (increasing load to Max, followed by decreasing load back to zero).
- Includes Min, capacity turning points ($500e, 2000e$), and Max.
- Condition: At every step $k$, $|E_{c, k}| \le mpe(L_k)$.

### 3. Repeatability Test (Clause A.4.10)
- Two series of repeated weighings: one at $\approx 50\%$ Max and one at $100\%$ Max.
- Each series comprises at least 3 weighings.
- Condition: The spread (difference between maximum and minimum error) must satisfy:
  $$\Delta E = E_{\max} - E_{\min} \le |mpe(L)|$$

### 4. Eccentricity / Off-Center Loading Test (Clause A.4.7)
- A test load of $\approx \frac{1}{3}\text{Max}$ (or $\frac{1}{4}\text{Max}$ for multiple support points) is applied at:
  1. Center
  2. Front-Left
  3. Front-Right
  4. Rear-Left
  5. Rear-Right
- Condition: For all positions $i \in \{1, 2, 3, 4, 5\}$, $|E_{c, i}| \le mpe(L)$.

### 5. Discrimination Test (Clause A.4.8)
- With the instrument loaded in equilibrium, an additional load $\Delta L = 1.4d$ is placed gently.
- Condition: The indication must change by at least $1d$:
  $$|I_2 - I_1| \ge 1d$$

---

## 6. Overall Compliance Aggregation

Overall compliance for a test project is evaluated dynamically:

$$\text{Project Compliance} = \begin{cases} 
\text{FAIL} & \text{if any mandatory test fails} \\
\text{PASS} & \text{if all mandatory tests pass} \\
\text{WARNING} & \text{if non-critical warnings exist and no tests fail} \\
\text{PENDING} & \text{if testing is incomplete}
\end{cases}$$
