// functions/api/chat.ts
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";


export const onRequestPost: PagesFunction<{ OPENROUTER_API_KEY: string }> = async (ctx) => {
  const { messages } = await ctx.request.json();

  const model = new ChatOpenAI({
    model: ctx.env.DEFAULT_MODEL, // or any OpenRouter model
    apiKey: ctx.env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
    streaming: true,
  });

  // Simple chain / agent logic here
  const stream = await model.stream([
    new SystemMessage(
      `You are a helpful assistant. 
      Use First Principles Reasoning Approach to understand User's Goal before answering.
      Don't use Math Formulas, Just Text, Words or Characters Formulas. 
      Answer with up to 400 words. 
      Use bulletpoints, three spaces, horizontal lines, 
      and lines with up to 80 characters to improve text formatting.
      `
    ),
    ...messages.map((m: any) =>
      m.role === "user" ? new HumanMessage(m.content) : m
    ),
  ]);

  // Convert LangChain stream → SSE for your frontend
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    for await (const chunk of stream) {
      const text = chunk.content?.toString() || "";
      if (text) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({
          choices: [{ delta: { content: text } }]
        })}\n\n`));
      }
    }
    await writer.write(encoder.encode("data: [DONE]\n\n"));
    await writer.close();
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
};
