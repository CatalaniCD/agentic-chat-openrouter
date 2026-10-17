# Design: OpenRouter Chat

Status: accepted. Companion to `docs/intent.md`.
Last updated: 2026-10-17

## Overview

Two deployable units:

1. **Static SPA** — `public/index.html` (HTML + CSS variables + one ES module).
2. **Edge API** — `functions/api/chat.ts`, a Cloudflare Pages Function at `POST /api/chat`.

There is no build step, no database, and no server state between requests.

## Components

| Unit | File | Responsibility |
|------|------|----------------|
| SPA | `public/index.html` | Layout, theming, model select, quick actions, SSE consumption, incremental markdown |
| API | `functions/api/chat.ts` | Build the LangChain `ChatOpenAI` client, stream OpenRouter output back as SSE |
| Config | `wrangler.toml` | `DEFAULT_MODEL` var; `pages_build_output_dir = "public"` |
| Secrets | `.dev.vars` / Pages env | `OPENROUTER_API_KEY` (never bundled to the client) |

## API contract — `POST /api/chat`

**Request**

```json
{
  "messages": [{ "role": "user", "content": "..." }],
  "model": "nvidia/nemotron-3-ultra-550b-a55b:free",
  "stream": true
}
```

**Response** — `Content-Type: text/event-stream`, `Cache-Control: no-cache`

```
data: {"choices":[{"delta":{"content":"Hel"}]}

data: {"choices":[{"delta":{"content":"lo"}]}}

data: [DONE]

```

The frame shape deliberately mirrors the OpenAI streaming API so the frontend
parser (`index.html:327`) does not depend on LangChain types.

## Data flow

1. User submits via the form or a quick-action button → `executeChatSubmission` (`index.html:280`).
2. `history` (including a client-side system message) is POSTed to `/api/chat` with the selected `model`.
3. `chat.ts` builds `ChatOpenAI` pointed at `https://openrouter.ai/api/v1` and calls `.stream([...])`.
4. Each LangChain chunk is re-emitted as a `data:` SSE frame.
5. Frontend reads the stream, accumulates `full` text, and feeds each delta to `streaming-markdown`.
6. `[DONE]` ends parsing; the assistant turn is appended to `history`.

## Decisions

- **D1 — No build step.** Static HTML keeps the deploy surface tiny. Trade-off: Tailwind via CDN, no bundler/lint stage.
- **D2 — LangChain over raw `fetch`.** Provides a provider-agnostic streaming abstraction. Trade-off: larger dependency tree for a thin wrapper.
- **D3 — Re-emit OpenAI delta shape.** Keeps the client parser stable across providers.
- **D4 — Key server-side only.** The Function holds the key; the browser never sees it.
- **D5 — System prompt in the backend.** The authoritative persona lives in `chat.ts:20`. (Note: the client also sends one — see gaps.)
- **D6 — Model IDs are configuration.** Listed in `index.html` and defaulted via `wrangler.toml`.

## Known gaps / deviations (feeds `plan.md`)

- Client `model` is ignored; the backend always uses `ctx.env.DEFAULT_MODEL` (`chat.ts:9-16`).
- Two system prompts may be sent — one from client `history[0]` (`index.html:256`) and one from the server (`chat.ts:20`).
- Non-OK responses are not produced with a JSON `error` field, so the client's error branch (`index.html:309-312`) rarely triggers; failures surface as worker exceptions.
- No request cancellation / writer error handling if the client disconnects mid-stream.
- No auth, rate limiting, or per-user cost control.

## Non-functional

- **Security:** secrets stay server-side; no PII storage. Public deployment + shared key is an abuse risk (see intent open questions).
- **Performance:** streaming starts on first token; edge runtime removes cold-start servers. SSE avoids buffering.
- **Accessibility:** native `<select>` and `<button>`; theme toggle is a real button. No formal a11y audit yet.
- **Browser support:** modern evergreen browsers (ES modules, `ReadableStream`, CSS custom properties).
