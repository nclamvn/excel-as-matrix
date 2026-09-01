# TIP-006: Explicit AI runtime states

## Header

- TIP-ID: TIP-006
- Project: ExcelAI
- Module: AI client/store/UI
- Depends on: TIP-005 VERIFIED LOCALLY
- Priority: P0
- Status: VERIFIED

## Context

- `DEFAULT_AI_CONFIG.mockMode=true` makes a clean install silently present simulated answers as the default AI experience.
- Even when `mockMode=false`, the client falls back to mock responses when no API key/proxy exists.
- The UI only labels mock mode; it does not distinguish checking, offline, configured proxy or browser-key transport.

## Task

Make AI availability a typed, observable runtime contract. Default to fail-closed offline, require explicit demo opt-in, distinguish configured transport, and prevent any unconfigured request from returning a simulated answer.

## Acceptance criteria

- Clean/default config resolves to `offline`, never mock.
- `mock` requires explicit config/user action and is visibly labeled Demo.
- A configured server proxy resolves to `configured` with proxy transport; direct browser key is separately identified as less safe.
- Unconfigured send/stream throws a stable unavailable error and performs no Anthropic request.
- Header and chat input expose checking/offline/mock/configured states; offline input is disabled with retry and explicit demo opt-in.
- Unit tests prove offline, mock and configured paths; existing builds/tests/lint/format and critical Chromium remain green.

## Constraints

- Do not require a real API key or external model call in automated tests.
- Do not store browser API keys.
- Do not imply configured means the model response quality is production-verified.
