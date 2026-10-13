# OpenRouter Chat

A minimal, streaming chat interface built on **Cloudflare Pages** with **OpenRouter** and **LangChain**. Features a clean UI with light/dark mode, model selection, markdown streaming, and quick-action prompts.

## ✨ Features

- **Streaming Responses** — Server-Sent Events (SSE) for real-time token streaming
- **Multiple Free Models** — Pre-configured with 5 free OpenRouter models
- **Markdown Rendering** — Streaming markdown via `streaming-markdown`
- **Light/Dark Theme** — Persisted preference with system detection
- **Quick Actions** — One-click prompt buttons for common tasks
- **Edge Runtime** — Deployed on Cloudflare Pages Functions (zero cold start)
- **No Build Step** — Pure HTML/CSS/JS + TypeScript API handler

## 🏗 Architecture

```
├── public/
│   └── index.html          # Single-file SPA (HTML + CSS + JS module)
├── functions/
│   └── api/
│       └── chat.ts         # Cloudflare Pages Function (SSE streaming)
├── wrangler.toml           # Cloudflare Pages config
├── package.json            # Dependencies (wrangler, langchain, streaming-markdown)
└── .dev.vars               # Local environment variables (gitignored)
```

### Data Flow

1. User sends message → `fetch("/api/chat", { method: "POST", body: JSON.stringify({ messages, model }) })`
2. `functions/api/chat.ts` receives request, initializes `ChatOpenAI` with OpenRouter base URL
3. LangChain streams tokens → converted to SSE format (`data: {...}\n\n`)
4. Frontend consumes SSE via `ReadableStream`, feeds chunks to `streaming-markdown` parser
5. Markdown renders incrementally in the chat bubble

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare account (for deployment)
- OpenRouter API key

### Local Development

```bash
# Install dependencies
npm install

# Create .dev.vars with your OpenRouter API key
echo 'OPENROUTER_API_KEY="sk-or-v1-..."' > .dev.vars

# Start dev server (Cloudflare Pages emulator)
npm run dev
```

Visit `http://localhost:8788` (or the port shown in terminal).

### Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | *Required* |
| `DEFAULT_MODEL` | Default model ID | `nvidia/nemotron-3-ultra-550b-a55b:free` |

Set in `.dev.vars` (local) or Cloudflare Pages dashboard (production).

## 📦 Deployment

```bash
# Deploy to Cloudflare Pages
npm run deploy
```

Or connect your Git repo in the Cloudflare Pages dashboard for automatic deployments on push.

### Environment Variables (Production)

Add in Cloudflare Pages → Settings → Environment Variables:

| Name | Value |
|------|-------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
| `DEFAULT_MODEL` | (Optional) Override default model |

## 🎨 Customization

### Adding Models

Edit the `<select id="model">` in `public/index.html`:

```html
<option value="provider/model-name">Display Name</option>
```

### Quick Actions

Add buttons inside `#quick-actions-container`:

```html
<button data-suggestion="Your prompt here"
  class="w-full text-left text-sm px-3 py-2.5 rounded-xl hover:bg-[var(--surface-hover)] transition">
  Button Label
</button>
```

### Styling

CSS custom properties in `:root` (light) and `.dark` (dark) control all colors. Modify in `<style>` block of `index.html`.

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| Hosting | Cloudflare Pages |
| Runtime | Cloudflare Pages Functions (Workers) |
| Language | TypeScript (API), Vanilla JS (Frontend) |
| LLM SDK | LangChain (`@langchain/openai`, `@langchain/core`) |
| LLM Provider | OpenRouter (OpenAI-compatible API) |
| Markdown | `streaming-markdown` (incremental parsing) |
| Styling | Tailwind CSS (via CDN) + CSS Variables |

## 📄 License

MIT — see [LICENSE](LICENSE) for details.