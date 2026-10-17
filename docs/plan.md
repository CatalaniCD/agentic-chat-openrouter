# Plan: OpenRouter Chat

Status: draft. Reads `docs/intent.md` and `docs/design.md`.
Last updated: 2026-10-17

> In the AI-native loop this is the *plan mode* output: the ordered, reviewable
> slice of work derived from the accepted intent and design. Each item ends by
> committing an artifact (code + tests, or a doc update).

## Milestones

### M0 — Documentation baseline *(this change)*
- Commit `docs/intent.md`, `docs/design.md`, `docs/plan.md`, `docs/test.md`.
- Add a `CLAUDE.md` at repo root with commands, conventions, and known pitfalls.
- ✅ Exit: docs merged; README links to them.

### M1 — Correctness fixes
- Honor the client-selected `model`, falling back to `DEFAULT_MODEL` when absent.
- Collapse to a single, authoritative system prompt.
- Emit a structured error frame (or `{ "error": ... }` body) on failure so the
  client error branch (`index.html:309-312`) works.
- ✅ Exit: model selection observable in the response; one system prompt in the request.

### M2 — Verification loop
- Adopt the single-command path defined in `test.md` (`make test` or npm script):
  build/typecheck + SSE smoke test + function unit test.
- Add a hook that blocks edits to test files while fixing a failing test.
- ✅ Exit: `npm test` green locally and in a CI check.

### M3 — Configuration
- Move model list + quick actions to a small config object (still static, no build).
- ✅ Exit: adding a model is a one-line config change.

### M4 — Hardening
- Rate limiting / abuse protection on `/api/chat` (Cloudflare rules or Worker logic).
- Request cancellation and writer cleanup on client disconnect.
- Basic request logging (no prompt contents) for observability.
- ✅ Exit: documented limits; disconnect no longer throws.

### M5 — Stretch
- Conversation persistence/export, richer markdown edge cases, multi-turn trimming.

## AI-native workflow (adopt high-leverage plays first)

1. **CLAUDE.md + feedback loop + intent home** — M0 (in progress).
2. **Top skills + hooks** — e.g. `security-review`, `sse-contract`; a hook for hard requirements (key/server-side only).
3. **Plan mode + intent→design** — spec changes start from `intent.md`.
4. **PR review with REVIEW.md** — agent reviews, human owns intent/risk.
5. **Parallel sessions** — only as many worktrees as one engineer can review.
6. **Continuous evals** — 20–50 real prompts run non-interactively on config/skill/CLAUDE.md changes.
7. **Production gates + sandboxed CI** — deploy authorization as a `PreToolUse` hook; short-lived creds.
8. **Monitoring loop** — see `test.md`; incidents become permanent evals.

## Metrics

| Stage | Leading | Lagging |
|-------|---------|---------|
| Plan | first conversation → committed intent | intent survival into design |
| Design | intent → design elapsed | rework after plan starts |
| Build | concurrent sessions while review holds | merged changes/engineer; rework rate |
| Test | first-pass CI success | review time; change-failure rate |
| Deploy | time to first review | pre-merge vs production defects |
| Maintain | band breach → new intent | repeat-incident rate |

## Risks

- **Public deploy + shared key** → cost abuse. Mitigate in M4 before wide sharing.
- **Free model churn** → broken defaults. Config-driven (M3) + a startup validation eval.
- **No test runner today** → regressions slip in. M2 is the unblock for every later item.
