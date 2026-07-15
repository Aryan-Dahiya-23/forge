import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ScreenshotComponent } from "./ScreenshotComponent";

export interface ScreenshotOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    screenshot: {
      /**
       * Insert a Screenshot placeholder block (src + caption).
       */
      insertScreenshot: (attrs?: {
        src?: string | null;
        caption?: string;
      }) => ReturnType;
    };
  }
}

/**
 * Light image block for SOPs — local file → data URL only (no server upload).
 * Spec §4.1 Screenshot node.
 */
export const Screenshot = Node.create<ScreenshotOptions>({
  name: "screenshot",

  group: "block",

  atom: true,

  draggable: true,

  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null as string | null,
        parseHTML: (element) => element.getAttribute("data-src") || null,
        renderHTML: (attributes) => {
          if (!attributes.src) return {};
          return { "data-src": attributes.src };
        },
      },
      caption: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-caption") ?? "",
        renderHTML: (attributes) => ({
          "data-caption": attributes.caption ?? "",
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="screenshot"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "screenshot",
      }),
    ];
  },

  addCommands() {
    return {
      insertScreenshot:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              src: attrs.src ?? null,
              caption: attrs.caption ?? "",
            },
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ScreenshotComponent);
  },
});
