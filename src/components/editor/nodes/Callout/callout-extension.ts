import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CalloutComponent } from "./CalloutComponent";

export type CalloutVariant = "tip" | "warning" | "note";

export interface CalloutOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      /**
       * Insert a Callout node with an optional variant.
       */
      insertCallout: (attrs?: { variant?: CalloutVariant }) => ReturnType;
    };
  }
}

export const Callout = Node.create<CalloutOptions>({
  name: "callout",

  group: "block",

  content: "block+",

  defining: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      variant: {
        default: "note" satisfies CalloutVariant,
        parseHTML: (element) =>
          (element.getAttribute("data-variant") as CalloutVariant) || "note",
        renderHTML: (attributes) => ({
          "data-variant": attributes.variant,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "callout",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertCallout:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              variant: attrs.variant ?? "note",
            },
            content: [
              {
                type: "paragraph",
              },
            ],
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent, {
      className: "callout-node-view",
    });
  },
});
