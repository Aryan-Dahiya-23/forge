import type { JSONContent } from "@tiptap/core";
import { getText, renderInlineMarkdown } from "./serialize";

/**
 * Serialize a TipTap document JSON tree to Markdown,
 * including DocForge Step / Callout / Screenshot nodes.
 */
export function documentToMarkdown(
  doc: JSONContent,
  title?: string,
): string {
  const parts: string[] = [];

  if (title?.trim()) {
    parts.push(`# ${title.trim()}`);
    parts.push("");
  }

  const body = (doc.content ?? [])
    .map((node) => blockToMarkdown(node))
    .filter((chunk) => chunk.length > 0)
    .join("\n\n");

  if (body) parts.push(body);
  return `${parts.join("\n").trim()}\n`;
}

function blockToMarkdown(node: JSONContent): string {
  switch (node.type) {
    case "paragraph": {
      const text = renderInlineMarkdown(node.content).trim();
      return text;
    }
    case "heading": {
      const level = Math.min(
        6,
        Math.max(1, Number(node.attrs?.level) || 1),
      );
      const text = renderInlineMarkdown(node.content).trim();
      return `${"#".repeat(level)} ${text}`;
    }
    case "bulletList":
      return (node.content ?? [])
        .map((item) => listItemToMarkdown(item, "-"))
        .join("\n");
    case "orderedList": {
      const start = Number(node.attrs?.start) || 1;
      return (node.content ?? [])
        .map((item, index) =>
          listItemToMarkdown(item, `${start + index}.`),
        )
        .join("\n");
    }
    case "blockquote": {
      const inner = (node.content ?? [])
        .map((child) => blockToMarkdown(child))
        .join("\n\n");
      return inner
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    }
    case "codeBlock": {
      const lang = String(node.attrs?.language ?? "");
      const code = getText(node);
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }
    case "horizontalRule":
      return "---";
    case "step": {
      const number = Number(node.attrs?.number) || 1;
      const stepTitle = String(node.attrs?.title ?? "").trim() || "Step";
      const body = (node.content ?? [])
        .map((child) => blockToMarkdown(child))
        .filter(Boolean)
        .join("\n\n");
      const header = `### Step ${number}: ${stepTitle}`;
      return body ? `${header}\n\n${body}` : header;
    }
    case "callout": {
      const variant = String(node.attrs?.variant ?? "note").toUpperCase();
      const text = renderInlineMarkdown(node.content).trim();
      return [`> **${variant}**`, `> ${text || "…"}`].join("\n");
    }
    case "screenshot": {
      const src = node.attrs?.src ? String(node.attrs.src) : "";
      const caption = String(node.attrs?.caption ?? "").trim();
      if (!src) {
        return caption
          ? `*[Screenshot placeholder — ${caption}]*`
          : "*[Screenshot placeholder]*";
      }
      const alt = caption || "Screenshot";
      // Data URLs work in some MD viewers; still include caption as emphasis
      const image = `![${alt}](${src})`;
      return caption ? `${image}\n\n*${caption}*` : image;
    }
    default: {
      if (node.content?.length) {
        return node.content
          .map((child) => blockToMarkdown(child))
          .filter(Boolean)
          .join("\n\n");
      }
      return getText(node).trim();
    }
  }
}

function listItemToMarkdown(item: JSONContent, bullet: string): string {
  const blocks = item.content ?? [];
  if (blocks.length === 0) return `${bullet} `;

  const [first, ...rest] = blocks;
  const firstLine = blockToMarkdown(first).replace(/\n/g, "\n  ");
  const restLines = rest
    .map((block) => blockToMarkdown(block))
    .filter(Boolean)
    .map((chunk) =>
      chunk
        .split("\n")
        .map((line) => `  ${line}`)
        .join("\n"),
    )
    .join("\n\n");

  return restLines
    ? `${bullet} ${firstLine}\n\n${restLines}`
    : `${bullet} ${firstLine}`;
}
