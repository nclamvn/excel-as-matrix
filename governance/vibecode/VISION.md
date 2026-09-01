# Vision · ExcelAI as a trusted, auditable AI spreadsheet

## Product thesis

ExcelAI should become the spreadsheet that can act on a user's behalf while every consequential change remains previewable, attributable, reversible and reproducible. Its differentiator is not having the longest feature list; it is combining spreadsheet depth with local/offline resilience and an explicit trust contract for AI actions.

## Target outcome

A finance or operations analyst can open a real workbook, ask for a multi-step transformation, inspect sources and proposed changes, approve only the safe subset, recover instantly, and share an audit trail—without needing to trust a black box.

## Architecture direction

- Preserve the current frontend stack and Canvas grid.
- Establish install/build/lint/unit/E2E/security as release gates before feature work.
- Make the existing AI context, grounding, risk, diff, sandbox, approval and audit modules one coherent lifecycle.
- Make mock/offline/configured-AI states explicit in UI and tests.
- Select one canonical realtime transport; prove it with two-browser tests.
- Keep Refinery/SOT governance outside runtime code, but use their outputs to drive roadmap and published claims.
- Split heavy import/export and feature surfaces behind real dynamic boundaries with bundle budgets.

## Non-goals for the next wave

- No rewrite to another framework.
- No new spreadsheet feature family before P0 gates pass.
- No claim of production readiness from manually edited Markdown.
- No automatic resolution of disputed facts or AI-generated values.
- No collection of private customer data in the research registry.

## Success measures

- Clean install, frontend/server builds, lint and critical E2E all PASS on CI.
- Zero critical/high production vulnerabilities.
- 100% of AI write actions emit preview, risk, approval decision, result and rollback/audit record.
- Collaboration critical path passes with two independent browser contexts.
- Published status is bound to the current SOT/CI digest.
- Initial app and heavy feature chunks meet approved budgets.
