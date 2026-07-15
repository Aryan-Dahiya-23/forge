import type { Editor, Range } from "@tiptap/core";
import type { CalloutVariant } from "../nodes/Callout/callout-extension";

export type SlashCommandItem = {
  title: string;
  description: string;
  searchTerms: string[];
  group: "blocks" | "format";
  icon: string;
  command: (props: { editor: Editor; range: Range }) => void;
};

function deleteSlashQuery({ editor, range }: { editor: Editor; range: Range }) {
  return editor.chain().focus().deleteRange(range);
}

function insertCallout(variant: CalloutVariant): SlashCommandItem["command"] {
  return ({ editor, range }) => {
    deleteSlashQuery({ editor, range }).insertCallout({ variant }).run();
  };
}

/**
 * Slash menu catalog. Custom DocForge blocks first; standard formatting second.
 */
export const SLASH_ITEMS: SlashCommandItem[] = [
  {
    title: "Step",
    description: "Numbered step block with a title and body",
    searchTerms: ["step", "sop", "procedure", "instruction", "numbered"],
    group: "blocks",
    icon: "1",
    command: ({ editor, range }) => {
      deleteSlashQuery({ editor, range }).insertStep().run();
    },
  },
  {
    title: "Callout · Note",
    description: "Neutral note callout",
    searchTerms: ["callout", "note", "info", "aside"],
    group: "blocks",
    icon: "N",
    command: insertCallout("note"),
  },
  {
    title: "Callout · Tip",
    description: "Helpful tip callout",
    searchTerms: ["callout", "tip", "hint", "best practice"],
    group: "blocks",
    icon: "T",
    command: insertCallout("tip"),
  },
  {
    title: "Callout · Warning",
    description: "Warning callout for cautions",
    searchTerms: ["callout", "warning", "caution", "danger", "alert"],
    group: "blocks",
    icon: "!",
    command: insertCallout("warning"),
  },
  {
    title: "Screenshot",
    description: "Add an image with an optional caption",
    searchTerms: ["image", "screenshot", "img", "photo", "picture", "upload"],
    group: "blocks",
    icon: "🖼",
    command: ({ editor, range }) => {
      deleteSlashQuery({ editor, range }).insertScreenshot().run();
    },
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    searchTerms: ["h1", "heading", "title"],
    group: "format",
    icon: "H1",
    command: ({ editor, range }) => {
      deleteSlashQuery({ editor, range }).setHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    searchTerms: ["h2", "heading", "subtitle"],
    group: "format",
    icon: "H2",
    command: ({ editor, range }) => {
      deleteSlashQuery({ editor, range }).setHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    searchTerms: ["h3", "heading"],
    group: "format",
    icon: "H3",
    command: ({ editor, range }) => {
      deleteSlashQuery({ editor, range }).setHeading({ level: 3 }).run();
    },
  },
  {
    title: "Bullet list",
    description: "Unordered list",
    searchTerms: ["ul", "bullet", "list", "unordered"],
    group: "format",
    icon: "•",
    command: ({ editor, range }) => {
      deleteSlashQuery({ editor, range }).toggleBulletList().run();
    },
  },
  {
    title: "Numbered list",
    description: "Ordered list",
    searchTerms: ["ol", "numbered", "list", "ordered"],
    group: "format",
    icon: "1.",
    command: ({ editor, range }) => {
      deleteSlashQuery({ editor, range }).toggleOrderedList().run();
    },
  },
  {
    title: "Paragraph",
    description: "Plain text paragraph",
    searchTerms: ["p", "text", "paragraph", "body"],
    group: "format",
    icon: "¶",
    command: ({ editor, range }) => {
      deleteSlashQuery({ editor, range }).setParagraph().run();
    },
  },
];

export function filterSlashItems(query: string): SlashCommandItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return SLASH_ITEMS;

  return SLASH_ITEMS.filter((item) => {
    const haystack = [item.title, item.description, ...item.searchTerms]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
