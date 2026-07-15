import type { Editor, JSONContent } from "@tiptap/core";
import type { AiAction } from "@/lib/ai/types";

export type ExpandStep = {
  title: string;
  body: string;
};

/**
 * Replace the captured selection via a ProseMirror transaction (not a DOM swap),
 * so undo/redo and cursor state stay correct.
 */
export function applyAiResult(params: {
  editor: Editor;
  action: AiAction;
  from: number;
  to: number;
  result: string;
}): void {
  const { editor, action, from, to, result } = params;

  if (action === "expand") {
    const steps = parseExpandSteps(result);
    if (steps.length === 0) {
      throw new Error("Could not parse steps from the model response.");
    }

    const content = stepsToJson(steps);
    editor.chain().focus().insertContentAt({ from, to }, content).run();
    return;
  }

  // rewrite / simplify — text replace keeps surrounding node structure intact
  const cleaned = result.replace(/\r\n/g, "\n").trim();
  editor
    .chain()
    .focus()
    .command(({ tr, dispatch }) => {
      if (dispatch) {
        tr.insertText(cleaned, from, to);
      }
      return true;
    })
    .run();
}

function stepsToJson(steps: ExpandStep[]): JSONContent[] {
  return steps.map((step, index) => ({
    type: "step",
    attrs: {
      number: index + 1,
      title: step.title,
    },
    content: [
      {
        type: "paragraph",
        content: step.body ? [{ type: "text", text: step.body }] : undefined,
      },
    ],
  }));
}

export function parseExpandSteps(raw: string): ExpandStep[] {
  const jsonText = extractJsonArray(raw);
  if (!jsonText) return [];

  try {
    const parsed: unknown = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (typeof item !== "object" || item === null) return null;
        const title =
          "title" in item && typeof item.title === "string"
            ? item.title.trim()
            : "";
        const body =
          "body" in item && typeof item.body === "string"
            ? item.body.trim()
            : "";
        if (!title && !body) return null;
        return {
          title: title || "Step",
          body: body || title,
        };
      })
      .filter((step): step is ExpandStep => step !== null);
  } catch {
    return [];
  }
}

function extractJsonArray(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    const end = trimmed.lastIndexOf("]");
    if (end !== -1) return trimmed.slice(0, end + 1);
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    const inner = fenced[1].trim();
    const start = inner.indexOf("[");
    const end = inner.lastIndexOf("]");
    if (start !== -1 && end !== -1) return inner.slice(start, end + 1);
  }

  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return null;
}
