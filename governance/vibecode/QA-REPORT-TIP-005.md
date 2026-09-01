# QA Report · ExcelAI TIP-005

Date: 2026-09-01  
Version: 1.0.0 working tree  
Environment: local clean install; remote GitHub execution not claimed

## Summary

| Tier | Passed | Failed | Skipped | Total | Status |
|---|---:|---:|---:|---:|---|
| Tier 1 — CI contract and clean gates | 10 | 0 | 0 | 10 | PASS |
| Tier 2 — SOT adversarial behavior | 4 | 0 | 0 | 4 | PASS |
| Tier 3 — remote execution | 0 | 0 | 1 | 1 | PENDING PUSH |

Local TIP acceptance pass rate: 10/10 = 100%.  
Overall status: **APPROVED LOCALLY — TIP-005; first remote run remains pending**.

## Acceptance matrix

| AC | Independent Contractor evidence | Result |
|---|---|---|
| Full gate coverage | Workflow contains locked install, lint, format, both builds, both unit suites, production audit and critical Chromium | PASS |
| Explicit supported runtime | `.nvmrc` is Node 24; checkout/setup-node/upload-artifact use current Node-24 major actions | PASS |
| Least privilege | Workflow declares only `contents: read`; no secrets or deploy step | PASS |
| Immutable evidence naming | Both artifacts contain run ID and full commit SHA, upload under `always()`, retain 30 days | PASS |
| Portable SOT gate | Clean state passed with 3 sources, 47 unique facts and matching registry/token digest | PASS |
| Adversarial SOT | Stale token, A3 exposure and canonical source tamper each exited 2 | PASS |
| Derived release status | JSON and README agree on `NOT_PRODUCTION_READY`; all scoped stabilization gates pass | PASS |
| README honesty | Static counts removed; port 5174 and evidence boundaries documented | PASS |
| Clean-install regression | Build/test/lint/format/audit/E2E commands all passed after `npm ci` | PASS |
| Workflow syntax | YAML and Node scripts parsed successfully | PASS |

## Remote boundary

The workflow has not been pushed, so there is no GitHub run ID or downloadable remote artifact. This is recorded in SOT as `QA.CI.REMOTE_RUN=NOT_RUN`; it is not hidden as a pass.

## Sign-off checklist

- [x] Local CI contract executable
- [x] SOT gate portable and adversarially tested
- [x] README/status drift fails loudly
- [x] No elevated GitHub permission
- [ ] First remote workflow run (requires commit/push outside this TIP)
