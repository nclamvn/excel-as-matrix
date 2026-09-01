# Completion Report · TIP-005

**Builder status:** DONE — local CI contract submitted for independent Contractor verification

## Files changed

- Added a least-privilege GitHub Actions workflow with quality and critical Chromium jobs.
- Pinned the project runner contract to Node 24 and current Node-24 official action majors.
- Added revision-addressed quality/browser artifacts with 30-day retention and failure upload.
- Added a dependency-free portable SOT checker for source SHA-256, fact uniqueness, A3 exposure and token digest freshness.
- Added four adversarial governance tests covering clean, stale-token, exposed-claim and source-tamper states.
- Added a deterministic release-evidence generator that writes JSON/Markdown and checks the README block for SOT drift.
- Removed static passing-count badges and corrected local port/configuration/readiness language in README.
- Updated the product-claim registry: builds are verified; the old 22-E2E and production-ready claims remain flagged.

## Builder test results

- `npm ci`: PASS; 893 locked packages installed.
- Workflow YAML parse and three Node syntax checks: PASS.
- `npm run test:governance`: PASS; 4/4 adversarial cases.
- `npm run sot:check`: PASS; 3 sources, 47 facts, token digest matched.
- `npm run release:evidence`: PASS; scoped gates true, classification `NOT_PRODUCTION_READY`, no README drift.
- Workflow-form JUnit commands: PASS; 1,887 frontend and 10 server tests.
- Production audit: PASS; 0 vulnerabilities.
- Lint/format/build/server build after clean install: PASS.
- Critical Chromium after clean install: PASS; 3/3.

## Issues discovered

- The original SOT executable lived outside the repository and its mtime comparison is unsuitable for a clean clone. CI now validates content hashes and token digest without trusting filesystem timestamps.
- The old README presented code surfaces as verified features and claimed “all features except realtime” in local mode. These statements are now scoped to reproduced evidence.
- A remote GitHub run cannot exist until the working tree is committed and pushed; the workflow is locally verified, not represented as remotely executed.

## Deviations

- No deployment, repository write permission or secret was added.
- CI artifacts are immutable by run/commit naming, but remote retention behavior remains pending the first GitHub run.

## Suggestions for Chủ thầu

- Verify workflow structure, portable bites, clean-install gates and README drift check independently.
- Mark the first remote run separately after a user-authorized commit/push.
- Proceed to TIP-006 explicit AI runtime states while keeping release classification blocked.
