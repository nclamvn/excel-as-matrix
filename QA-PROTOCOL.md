# Vibecode Kit v9.0 — QA Protocol Add-on

## Purpose

Ensure "DONE" = "Works on browser", not just "Build PASS + Tests PASS"

---

## 1. VERIFY Section (Add to every TIP)

After Steps, before Acceptance Criteria:

```markdown
## VERIFY (Required before reporting DONE)

### A. Build & Tests
\`\`\`bash
npm run build   # Must: PASS
npm test        # Must: All pass
\`\`\`

### B. Manual Test Matrix
Open `http://localhost:5173` and test:

| ID | User Action | Expected Result | Pass |
|----|-------------|-----------------|------|
| T1 | [specific action] | [specific result] | _ |
| T2 | [specific action] | [specific result] | _ |

### C. Edge Cases
| ID | Scenario | Expected | Pass |
|----|----------|----------|------|
| E1 | [edge case] | [behavior] | _ |

### D. Regression
- [ ] [Related feature still works]
```

---

## 2. Completion Report Format (Updated)

```
================================================================
COMPLETION REPORT — TIP-[ID]
================================================================

STATUS: DONE | PARTIAL | BLOCKED

FILES CREATED: [list]
FILES MODIFIED: [list]

BUILD: PASS | FAIL
TESTS: X/Y passed

----------------------------------------------------------------
MANUAL VERIFICATION
----------------------------------------------------------------
| ID | Action | Expected | Result |
|----|--------|----------|--------|
| T1 | [...] | [...] | PASS |
| T2 | [...] | [...] | PASS |

Manual: X/Y passed
Edge Cases: X/Y passed

----------------------------------------------------------------
ISSUES FOUND & FIXED
----------------------------------------------------------------
1. [issue] -> [fix]

================================================================
```

---

## 3. TIP-DEBUG Template (When bugs are found)

```markdown
# TIP-DEBUG-[NUMBER]: [Bug Title]

## Bug Report

### Observed
[What happens]

### Expected
[What should happen]

### Reproduce
1. [Step 1]
2. [Step 2]
3. [Observe bug]

### Severity
- Critical | High | Medium | Low

---

## Fix

### Verify Fix
| ID | Test | Result |
|----|------|--------|
| F1 | Original bug fixed | _ |
| F2 | Regression check | _ |

---

## Debug Report Format

STATUS: FIXED | WONTFIX | CANNOT REPRODUCE
ROOT CAUSE: [why]
FIX: [what changed]
FILES: [list]
PREVENTION: [how to avoid in future]
```

---

## 4. QA Feedback Loop

```
TIP -> Builder implements -> Builder self-test (VERIFY) -> Report
                                                            |
                                                    Owner spot-check
                                                            |
                                              PASS ----|---- FAIL
                                                |              |
                                            Next TIP    TIP-DEBUG-xxx
                                                              |
                                                          Builder fix
                                                              |
                                                      Owner re-test
```

---

## 5. When to use what

| Situation | Action |
|-----------|--------|
| New feature | TIP with VERIFY section |
| Bug found by owner | TIP-DEBUG-xxx |
| Regression discovered | Add to Regression checklist |
| Repeated pattern | Consider Playwright E2E |
