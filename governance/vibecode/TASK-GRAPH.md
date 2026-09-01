# Task Graph · ExcelAI continuation

## Dependency map

```text
TIP-001 Dependency contract and vulnerability floor
  ├─→ TIP-002 Server build and environment contract
  ├─→ TIP-003 Deterministic E2E harness
  └─→ TIP-004 Lint and format gate

TIP-002 + TIP-003 + TIP-004
  └─→ TIP-005 CI evidence and SOT-derived release status
        └─→ TIP-006 Explicit AI runtime states
              └─→ TIP-007 Trusted AI action vertical slice

TIP-003 + decision OQ-003
  └─→ TIP-008 Canonical realtime transport and two-client proof

TIP-002
  └─→ TIP-009 Backend security, signed billing and persistence

TIP-005
  ├─→ TIP-010 Bundle/I/O performance budgets
  └─→ TIP-011 Mobile and accessibility journeys

TIP-007 + user validation
  └─→ TIP-012 Provenance-aware research/enrichment feature
```

## TIP inventory

| TIP | Outcome | Priority | Depends on | Status |
|---|---|---|---|---|
| 001 | Plain `npm ci`; compatible lint toolchain; critical dependency remediation | P0 | None | VERIFIED |
| 002 | Server TypeScript build passes; environment contract documented/tested | P0 | 001 | VERIFIED |
| 003 | Playwright port fixed; critical Chromium journeys execute | P0 | 001 | VERIFIED |
| 004 | ESLint zero errors; formatting baseline applied in isolated reviewable change | P0 | 001 | VERIFIED |
| 005 | CI produces immutable evidence; README/status derives from it and SOT | P0 | 002–004 | VERIFIED LOCALLY |
| 006 | Offline/mock/configured-AI states are explicit and testable | P0 | 005 | VERIFIED |
| 007 | One AI task completes preview→approval→apply→rollback→audit | P0 | 006 | VERIFIED |
| 008 | One realtime transport; two-client sync/conflict/reconnect proof | P1 | 003 + OQ-003 | NEXT — Supabase recommended |
| 009 | Signed Stripe webhook, subscription persistence and server validation | P1 | 002 | BLOCKED BY DEPS |
| 010 | Heavy I/O lazy-loaded; approved bundle budgets enforced | P1 | 005 | BLOCKED BY DEPS |
| 011 | Keyboard, screen reader and mobile critical journeys | P2 | 005 | BLOCKED BY DEPS |
| 012 | Source-attributed web research/enrichment with honest-null/disputed states | P2 | 007 + validation | BLOCKED BY DEPS |

## Operating rhythm

For each TIP: Chủ thầu issues the frozen TIP → Thợ implements and self-tests → Completion Report → Chủ thầu independently verifies requirements and quantitative health → fix/refine or move to the next TIP. Any change to an approved architectural contract escalates to Chủ nhà.
