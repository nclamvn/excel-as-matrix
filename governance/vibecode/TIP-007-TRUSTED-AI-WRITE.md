# TIP-007: Trusted AI write transaction

## Header

- TIP-ID: TIP-007
- Project: ExcelAI
- Module: AI action runtime, audit, workbook and Copilot UI
- Depends on: TIP-006 VERIFIED
- Priority: P0
- Status: VERIFIED

## Context

The existing approval path changed an action to `success` without mutating the workbook. Its preview contained no real before-state, the original tool payload was discarded, rollback was absent from the user flow, and audit writes were fire-and-forget. This is a false-green production risk.

## Task

Deliver one narrow, trustworthy `write_range` vertical slice: propose, show exact before/after, explicitly approve, apply to the sheet captured at proposal time, persist an audit event, and roll back exactly once.

## Acceptance criteria

- A valid `write_range` proposal retains its executable tool call, workbook/sheet identity, exact before/after snapshots and per-cell changes.
- The proposed matrix must exactly match the target range; malformed/reversed ranges and shape mismatches fail before any write.
- A single proposal is capped at 10,000 cells and rejects unsupported, non-finite or oversized cell values before audit or mutation.
- Approval writes the exact target on the captured sheet once, never a later active sheet, and enters history only after durable audit succeeds.
- If application or audit fails, the before snapshot is restored and the action remains visibly pending.
- Rollback restores values/formulas from the before snapshot, records a durable audit event, marks history reverted, and a second rollback is rejected.
- The Actions UI exposes before/after values; History exposes rollback only for successful actions.
- Explicit Demo mode can exercise the same action pipeline through `demo write A1=value`; default/offline mode remains fail-closed.
- Focused unit tests and a critical Chromium journey prove propose -> preview -> approve -> workbook mutation -> rollback.
- Typecheck, lint, format, unit tests, build and SOT checks remain green.

## Constraints

- No direct AI write bypasses approval in this TIP, including autopilot mode.
- No real API key or external model call is required for automated verification.
- No claim of general transactional support for delete, format or bulk tools.
