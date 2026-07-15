import OpenAI from "openai";
import { buildMessages } from "@/lib/ai/prompts";
import { isAiAction, type AiAction } from "@/lib/ai/types";

const MAX_INPUT_CHARS = 8_000;

export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL;

  if (!apiKey) {
    return Response.json(
      { error: "Missing DEEPSEEK_API_KEY. Add it to your .env file." },
      { status: 500 },
    );
  }

  if (!model) {
    return Response.json(
      { error: "Missing DEEPSEEK_MODEL. Add it to your .env file." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const record =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : null;

  const text =
    record && typeof record.text === "string" ? record.text.trim() : "";

  const action: AiAction | null =
    record && isAiAction(record.action) ? record.action : null;

  if (!text) {
    return Response.json({ error: "Missing selection text." }, { status: 400 });
  }

  if (!action) {
    return Response.json(
      { error: "Invalid action. Use rewrite, expand, or simplify." },
      { status: 400 },
    );
  }

  if (text.length > MAX_INPUT_CHARS) {
    return Response.json(
      { error: `Selection too long (max ${MAX_INPUT_CHARS} characters).` },
      { status: 400 },
    );
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com",
  });

  try {
    const stream = await client.chat.completions.create({
      model,
      messages: buildMessages(action, text),
      stream: true,
      temperature: action === "expand" ? 0.3 : 0.5,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          }
          controller.close();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Stream failed.";
          controller.error(new Error(message));
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Action": action,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "DeepSeek request failed.";
    console.error("[/api/ai/rewrite]", message);
    return Response.json({ error: message }, { status: 502 });
  }
}
