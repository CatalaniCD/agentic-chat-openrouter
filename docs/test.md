# Test & Verification: OpenRouter Chat

Status: proposed. No test runner exists in the repo today (`package.json` has
only `dev` and `deploy`). This document defines the target verification path and
the governance around it.
Last updated: 2026-10-17

## Goal

Give every work session **one command** that answers "is this still working?" —
and turn every production incident into a permanent eval so it cannot recur.

## The single command

Once M2 lands, `npm test` (or `make test`) must run, in order:

1. `npx tsc --noEmit` — typecheck (Functions are TypeScript).
2. **Function unit test** — call `onRequestPost` with a stubbed `ctx` and a fake
   streaming model; assert SSE frame shape `choices[].delta.content` and trailing `data: [DONE]`.
3. **SSE smoke test** — boot `wrangler pages dev`, POST a fixed prompt, assert the
   response begins streaming and terminates with `[DONE]`.

Until then, verification is **manual** (see below) and must be stated as such.

## Manual verification (current baseline)

```bash
npm install
echo 'OPENROUTER_API_KEY="sk-or-v1-..."' > .dev.vars
npm run dev
# open http://localhost:8788

curl -N -X POST http://localhost:8788/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Say hi in 3 words"}],"model":"nvidia/nemotron-3-ultra-550b-a55b:free","stream":true}'
```

Expected: `data: {...}` frames with `delta.content`, ending in `data: [DONE]`.

## Test layers (target)

| Layer | Scope | Tool (proposed) |
|-------|-------|-----------------|
| Unit | `chat.ts` frame mapping, error path, model resolution | `vitest` + a stubbed model |
| Contract | SSE frame shape stays OpenAI-compatible | assertion in unit tests |
| Integration | `wrangler pages dev` + real stream | Node `fetch` script |
| UI | markdown renders, theme persists, model select honored | Playwright (or screenshot diff vs mock) |
| Evals | 20–50 real prompts, non-interactive | scripted, gated on pass rate |

## Bug workflow

1. Write a **failing test first**, commit it.
2. A hook blocks edits to test files while the fix is in progress.
3. Ask the agent to make the test pass.
4. Only then merge — the test is the regression guard.

## Continuous evals

- Run 20–50 real tasks non-interactively on changes to `CLAUDE.md`, skills, hooks,
  model config, and `chat.ts`.
- Gate config merges on a pass-rate threshold.
- **Every production incident becomes a permanent eval** — add the failing prompt
  to the eval set, then fix.

## Governance & measurement

- **Hard requirements → hooks, not skills.** "Key never reaches the client" is a
  deterministic check (grep built output / assert no `OPENROUTER_API_KEY` in
  served assets), not advisory guidance.
- **Human gate** stays on deploy authorization (see `plan.md` M4).
- **Leading indicator:** first-pass CI success for agent changes.
- **Lagging indicators:** review time, change-failure rate, repeat-incident rate.

## Coverage targets

- `functions/api/chat.ts`: happy path, missing key, provider error, client disconnect (100% of branches).
- `public/index.html`: stream parsing, `[DONE]` handling, model selection, quick-action click.
