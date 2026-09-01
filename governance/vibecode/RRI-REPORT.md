# RRI Report · ExcelAI continuation

Date: 2026-08-27  
Mode: Scan-first; known questions auto-answered; strategic unknowns proposed with defaults.

## Requirements matrix

| ID | Requirement | Source | Priority | Persona |
|---|---|---|---|---|
| REQ-001 | A clean clone installs with plain `npm ci` | QA baseline | P0 | Developer |
| REQ-002 | Frontend and backend TypeScript builds both pass | QA baseline | P0 | Operator |
| REQ-003 | Playwright starts deterministically and runs critical workbook flows | QA baseline | P0 | QA |
| REQ-004 | Release lint has zero errors; formatting is deterministic | QA baseline | P0 | Developer |
| REQ-005 | No critical/high production dependency vulnerability is shipped | npm audit | P0 | Operator |
| REQ-006 | Product status and badges are generated from current verified gates | SOT conflicts | P0 | Business |
| REQ-007 | AI writes follow preview → risk → approval → apply → rollback → audit | Code scan + benchmark | P0 | End user |
| REQ-008 | Production never silently presents mock AI as real AI | Code scan | P0 | End user |
| REQ-009 | One collaboration transport is canonical and proven with two real clients | Code scan | P1 | End user |
| REQ-010 | Core workbook editing/import/export keeps working offline | Existing product promise | P1 | End user |
| REQ-011 | Billing webhooks are authenticated and subscription state is persisted before monetization | Code scan | P1 | Operator |
| REQ-012 | Initial bundle has explicit budgets; heavy I/O loads on demand | Build output | P1 | End user |
| REQ-013 | Mobile and keyboard/screen-reader journeys have executable tests | Prior X-Ray + code scan | P2 | End user |
| REQ-014 | External research/insight outputs show sources and uncertainty | Refinery insight | P2 | End user |

## Auto-answered

- Architecture: preserve React/Vite/Zustand/Canvas; a rewrite is unjustified.
- Database/realtime: Supabase exists, but a second Hono WebSocket path competes with it.
- AI: a serious trust architecture exists in code but is not yet proven end-to-end.
- Offline: local operation is a stated product promise and supported by PWA/IndexedDB modules.
- Testing: unit coverage breadth is strong; integration/release gates are weak.
- Immediate priority: stabilization, not new feature breadth.

## Decisions log

| Decision | Options | Recommended | Rationale |
|---|---|---|---|
| D-001 | Rewrite vs stabilize | Stabilize | Existing 189k LOC and 1,884 tests are valuable assets |
| D-002 | Feature parity vs trusted wedge | Trusted, auditable AI spreadsheet | Competitors already cover generic AI actions |
| D-003 | Big-bang cleanup vs vertical gates | Small release-gate TIPs | Keeps diffs reviewable and failures attributable |
| D-004 | Manual claims vs SOT-derived status | SOT-derived | Prevents another “passing” badge drift |
| D-005 | Product code before approval vs checkpoint | Blueprint approval first | Large task and architecture choices remain |

## Open questions for Chủ nhà

- OQ-001: Confirm `nclamvn` is the SOT owner and final publish approver.
- OQ-002: Choose the first paying segment: finance/operations analysts, SMB operators, or general spreadsheet users. Recommendation: finance/operations analysts who value local control and traceable AI changes.
- OQ-003: Choose the canonical collaboration path. Recommendation: Supabase first for the existing provider integration; retain Hono only if self-hosting is a product requirement.
- OQ-004: Confirm the first deployment target and data-residency requirement.
- OQ-005: Confirm whether Claude remains the only AI provider or whether the runtime should be provider-neutral.
- OQ-006: Confirm release label until gates pass. Recommendation: “technical preview.”

These questions do not block stabilization TIP-001 through TIP-004; they block the collaboration and go-to-market waves.
