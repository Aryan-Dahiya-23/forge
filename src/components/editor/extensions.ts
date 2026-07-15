import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { Callout } from "./nodes/Callout/callout-extension";
import { Screenshot } from "./nodes/Screenshot/screenshot-extension";
import { Step } from "./nodes/Step/step-extension";
import { SlashCommand } from "./slash-command/slash-command-extension";

/**
 * TipTap extensions: StarterKit + custom Step, Callout, Screenshot + slash menu.
 * AI lives in the bubble menu + /api/ai/rewrite (not an editor extension).
 */
export function createEditorExtensions() {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      dropcursor: {
        width: 2,
        color: "oklch(var(--ring))",
      },
    }),
    Placeholder.configure({
      placeholder: ({ node, pos, editor }) => {
        if (node.type.name === "heading") {
          return "Heading…";
        }
        if (node.type.name === "callout") {
          return "Write a callout…";
        }

        if (node.type.name === "paragraph" && editor) {
          try {
            const $pos = editor.state.doc.resolve(pos);
            if ($pos.depth > 0 && $pos.parent.type.name === "callout") {
              return "Write a callout…";
            }
          } catch {
            // ignore
          }
        }

        return "Write, or type / for blocks…";
      },
      includeChildren: true,
    }),
    Step,
    Callout,
    Screenshot,
    SlashCommand,
  ];
}
