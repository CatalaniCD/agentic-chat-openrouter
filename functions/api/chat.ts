interface Env {
  OPENROUTER_API_KEY: string;
  DEFAULT_MODEL?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.OPENROUTER_API_KEY) {
    return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json() as {
      messages: Array<{ role: string; content: string }>;
      model?: string;
      stream?: boolean;
    };

    const model = body.model || env.DEFAULT_MODEL || "openai/gpt-4o-mini";
    const stream = body.stream !== false; // default true

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": new URL(request.url).origin,
        "X-Title": "Cloudflare OpenRouter Chat",
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        stream,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Stream the response directly to the client
    return new Response(response.body, {
      headers: {
        "Content-Type": stream ? "text/event-stream" : "application/json",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
