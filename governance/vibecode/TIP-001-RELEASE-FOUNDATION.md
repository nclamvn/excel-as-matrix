# TIP-001: Dependency contract and vulnerability floor

## Header

- TIP-ID: TIP-001
- Project: ExcelAI
- Module: package/dependency and release foundation
- Depends on: TIP-000
- Priority: P0
- Status: VERIFIED

## Context

- Working directory: `/Users/os/Desktop/ExcelAI`
- Key files: `package.json`, `package-lock.json`, `eslint.config.js`, build/test configs.
- Current facts: `npm ci` fails; legacy install reports a moving vulnerability set; unit tests pass; frontend builds.

## Task

Resolve the dependency and lint-toolchain contract so a clean checkout installs with plain `npm ci`, without force/legacy flags. Remediate critical vulnerabilities where compatible fixes exist, identify whether remaining findings affect production or development, and keep frontend build plus all unit tests green.

## Acceptance criteria

- Given an absent `node_modules`, when `npm ci` runs, then it exits 0 without `--force` or `--legacy-peer-deps`.
- Given the installed tree, when `npm ls --depth=0` runs, then it reports no invalid direct dependency.
- Given production dependencies, when `npm audit --omit=dev` runs, then no critical or high finding remains.
- Given the full dependency tree, when `npm audit` runs, then no critical finding remains; any lower unresolved item has a fact ID, exposure analysis and owner.
- Given the change, when `npm run build` and `npm run test:run` run, then both pass with 1,884 or more tests and no regression.
- The source lockfile is deterministic and matches `package.json`.

## Constraints

- Do not use audit force-fixes that silently introduce breaking major upgrades.
- Do not disable peer checks or security rules to obtain green output.
- Do not mix broad formatting or product feature changes into this TIP.
- If a major framework migration is required, report it as a Level-2 suggestion; do not perform it inside TIP-001.

## Report format

Return the standard Completion Report with exact command results, changed packages, vulnerability delta, deviations and follow-up suggestions.
