# Intent: OpenRouter Chat

Author: project maintainer. Status: accepted (retrofit of the existing implementation).
Last updated: 2026-10-17

> This captures *why* the project exists and what "better" means. It is the
> entry point of the loop; `design.md`, `plan.md`, and `test.md` all trace back here.

## Problem

Getting a working, low-cost LLM chat interface online normally requires a
backend server, secrets management, and a build pipeline. Small teams and
learners lack a minimal reference they can deploy to the edge in minutes
without ever exposing their provider API key in the browser.

## Proposed outcome

A single deployable Cloudflare Pages project that:

- streams OpenRouter responses token-by-token to the browser,
- keeps the OpenRouter API key server-side (Cloudflare Function env),
- lets a user pick among free models and fire one-click quick prompts,
- renders markdown incrementally as tokens arrive,
- requires no build step and no server for the operator to run.

Better looks like: clone → add one key → `npm run dev` → chat within minutes;
production is a single `npm run deploy`.

## Affected users and systems

- **Users** — developers/learners evaluating OpenRouter or serverless LLM hosting.
- **Systems** — Cloudflare Pages + Functions, OpenRouter API, LangChain OpenAI client, `streaming-markdown`.
- **Operators** — whoever owns the Cloudflare Pages project and the OpenRouter key.

## Constraints

- API key must never reach the browser; it lives in `.dev.vars` (local) or Pages env (production).
- Edge runtime (Workers): no Node-only APIs, no long-lived server state.
- No build step: frontend is static `public/index.html`; only Functions are bundled by Wrangler.
- SSE frames must stay OpenAI-compatible (`choices[].delta.content`) so the client parser is provider-agnostic.
- Free model IDs change often — they are configuration, not code.
- **Out of scope (for now):** auth/multi-user, persistence, conversation export, rate limiting, cost controls.

## Open questions

- Should the client-selected `model` be honored? Today the backend ignores the
  request body's `model` and always uses `DEFAULT_MODEL` (`functions/api/chat.ts:10`).
- The client sends a `system` message in `history`, and the backend prepends a
  second `SystemMessage` (`chat.ts:20`) — which prompt wins, and should there be one?
- Is a committed verification path required, or is manual browser testing acceptable?
- What is the abuse/cost policy if the deployment URL is public with a shared key?
- Should the model list and quick actions be config-driven instead of hardcoded in HTML?
- Should in-flight streams be cancelled on client disconnect, with writer cleanup?
