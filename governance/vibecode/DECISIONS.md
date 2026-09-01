# Decisions Log

| ID | Date | Decision | Rationale | Status |
|---|---|---|---|---|
| D-001 | 2026-08-27 | Treat current release as technical preview | Executable gates contradict production-ready claims | Accepted |
| D-002 | 2026-08-27 | Stabilize before adding feature breadth | Install/server/lint/E2E/security are release blockers | Accepted |
| D-003 | 2026-08-27 | Position around trusted, reversible AI actions | Competitor parity has moved beyond formula generation | Accepted |
| D-004 | 2026-08-27 | Keep React/Vite/Zustand/Canvas | Existing code/tests make rewrite value-negative | Accepted |
| D-005 | 2026-08-27 | Bind published status to SOT/CI evidence | Prevent manual claim drift | Implemented for governance artifacts |
| D-006 | 2026-08-27 | Defer product-code edits until Blueprint approval | Vibecode large-task checkpoint | Satisfied 2026-09-01 |
| D-007 | 2026-09-01 | Consume patched SheetJS 0.20.3 from its official CDN tarball | npm stops at vulnerable 0.18.5; `.xls` compatibility is retained without an anonymous fork | Active |
| D-008 | 2026-09-01 | Keep every AI write on explicit preview and approval, including autopilot | The prior auto-approval executor did not provide the same mutation, audit and rollback guarantees | Active |
| D-009 | 2026-09-01 | Bind an AI write to workbook and sheet identity captured at proposal time | A later active-sheet change must never redirect an already reviewed action | Active |
