import type { AiAction } from "@/lib/ai/types";

export async function streamAiRewrite(params: {
  text: string;
  action: AiAction;
  signal?: AbortSignal;
  onChunk?: (accumulated: string) => void;
}): Promise<string> {
  const response = await fetch("/api/ai/rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: params.text, action: params.action }),
    signal: params.signal,
  });

  if (!response.ok) {
    let message = `AI request failed (${response.status})`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // non-JSON error body
    }
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("No response stream from AI route.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
    params.onChunk?.(result);
  }

  result += decoder.decode();
  return result.trim();
}
