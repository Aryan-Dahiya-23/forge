import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { StepComponent } from "./StepComponent";

export interface StepOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    step: {
      /**
       * Insert a Step node with optional number and title.
       */
      insertStep: (attrs?: { number?: number; title?: string }) => ReturnType;
    };
  }
}

export const Step = Node.create<StepOptions>({
  name: "step",

  group: "block",

  content: "block+",

  draggable: true,

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      number: {
        default: 1,
        parseHTML: (element) => {
          const value = element.getAttribute("data-number");
          return value ? Number(value) : 1;
        },
        renderHTML: (attributes) => ({
          "data-number": attributes.number,
        }),
      },
      title: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-title") ?? "",
        renderHTML: (attributes) => ({
          "data-title": attributes.title,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="step"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "step",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertStep:
        (attrs = {}) =>
        ({ commands, state }) => {
          let maxNumber = 0;
          state.doc.descendants((node) => {
            if (node.type.name === this.name) {
              const n = Number(node.attrs.number) || 0;
              if (n > maxNumber) maxNumber = n;
            }
          });

          const number = attrs.number ?? maxNumber + 1;

          return commands.insertContent({
            type: this.name,
            attrs: {
              number,
              title: attrs.title ?? "",
            },
            content: [
              {
                type: "paragraph",
              },
            ],
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(StepComponent);
  },
});
