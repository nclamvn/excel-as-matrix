# Blueprint · ExcelAI continuation

Version: 1.0  
Date: 2026-08-27  
Nature: Existing large TypeScript application; stabilization followed by trusted-AI differentiation.

## Goals

Primary goal: turn the current broad prototype into a reproducibly releasable technical preview, then integrate the existing trust primitives into a differentiated AI action lifecycle.

Target audience: finance and operations analysts who value spreadsheet compatibility, local control and explainable AI changes. This audience is a recommended assumption pending OQ-002.

## System blueprint

```text
User intent
  → explicit runtime state (offline / mock demo / configured AI)
  → context + source tracking
  → plan and tool calls
  → sandboxed workbook diff
  → risk policy and approval
  → deterministic workbook commands
  → undo/recovery + audit event
  → verified UI result

Release pipeline
  → clean install
  → frontend + server type/build
  → lint + unit
  → critical E2E
  → dependency/security gate
  → SOT-bound status artifact
```

## Architectural contracts

- The workbook store remains the canonical in-app state authority; AI and realtime paths invoke explicit commands rather than mutating parallel state.
- Mock AI may exist only behind an unmistakable demo state and cannot satisfy configured-AI acceptance tests.
- One realtime transport becomes canonical per deployment profile; transport choice stays behind an adapter boundary.
- Server routes validate inputs and external signatures; no billing state changes from unsigned webhooks.
- Product claims are derivatives of executable verification, never editable authorities.
- Governance data remains in `governance/sot` and `research`; product runtime does not depend on the skill installation paths.

## Requirement mapping

| Blueprint area | Requirements |
|---|---|
| Release foundation | REQ-001–006 |
| Trusted AI lifecycle | REQ-007–008, REQ-014 |
| Collaboration | REQ-009 |
| Offline and performance | REQ-010, REQ-012 |
| Backend monetization | REQ-011 |
| Inclusive UX | REQ-013 |

## Delivery waves

1. Release truth: dependencies, server type safety, E2E harness, lint/format and SOT-derived status.
2. Trusted AI vertical slice: explicit runtime states and one complete preview/approve/apply/rollback/audit flow.
3. Collaboration contract: choose transport and pass two-client synchronization/conflict tests.
4. Production hardening: signed billing webhooks, server-side validation, auth/permission enforcement and observability.
5. Differentiation: provenance-aware external research, performance budgets, mobile/accessibility and user validation.

## Checkpoint

- [ ] Confirm or edit the recommended target segment.
- [ ] Confirm `nclamvn` as SOT/publish owner.
- [x] Approve stabilization before new feature breadth.
- [x] Approve the trust-first architecture.
- [x] Approve TIP-001 as the first Builder assignment.

Reply `APPROVED` to start TIP-001, or list edits to this Blueprint.
