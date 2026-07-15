import type { AiAction } from "./types";

const SYSTEM =
  "You are an editing assistant inside DocForge, a structured documentation tool for SOPs and how-to articles. Follow the action instructions exactly. Do not wrap the entire answer in markdown code fences unless the source text already uses them.";

export function buildMessages(
  action: AiAction,
  selectedText: string,
): { role: "system" | "user"; content: string }[] {
  const actionPrompt = ACTION_PROMPTS[action];
  return [
    { role: "system", content: SYSTEM },
    {
      role: "user",
      content: `${actionPrompt}\n\n---\nSelected text:\n${selectedText}`,
    },
  ];
}

const ACTION_PROMPTS: Record<AiAction, string> = {
  rewrite:
    "Rewrite the selected text so it is clearer and more polished for a professional SOP/documentation audience. Preserve the original meaning and approximate length. Return only the rewritten text — no preamble, labels, or quotes.",

  simplify:
    "Simplify and shorten the selected text. Prefer plain language, shorter sentences, and remove fluff while keeping essential meaning. Return only the simplified text — no preamble, labels, or quotes.",

  expand: `Turn the selected text into a short ordered list of concrete procedure steps.

Return ONLY a JSON array (no markdown fences, no commentary) with this shape:
[
  { "title": "short step title", "body": "1-3 sentences of instruction" }
]

Rules:
- 3 to 6 steps
- titles are concise (under ~8 words)
- body is actionable
- valid JSON only`,
};
