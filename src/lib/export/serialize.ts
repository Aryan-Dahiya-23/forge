import type { JSONContent } from "@tiptap/core";

/** Shared helpers for walking TipTap JSON (standard + DocForge custom nodes). */

export function getText(node: JSONContent | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  return (node.content ?? []).map(getText).join("");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function escapeMd(value: string): string {
  return value.replace(/([\\`*_{}[\]()#+\-.!|>])/g, "\\$1");
}

export function slugifyFilename(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "document";
}

type Mark = { type: string; attrs?: Record<string, unknown> };

export function renderInlineMarkdown(nodes: JSONContent[] | undefined): string {
  if (!nodes?.length) return "";

  return nodes
    .map((node) => {
      if (node.type === "hardBreak") return "  \n";
      if (node.type !== "text") {
        return renderInlineMarkdown(node.content);
      }

      let text = node.text ?? "";
      // Escape markdown specials but keep spaces readable
      text = text.replace(/([\\`*_{}[\]()#+.!-])/g, "\\$1");

      const marks = (node.marks as Mark[] | undefined) ?? [];
      for (const mark of marks) {
        if (mark.type === "bold") text = `**${text}**`;
        if (mark.type === "italic") text = `*${text}*`;
        if (mark.type === "code") text = `\`${node.text ?? ""}\``;
        if (mark.type === "strike") text = `~~${text}~~`;
        if (mark.type === "link" && mark.attrs?.href) {
          text = `[${node.text ?? ""}](${String(mark.attrs.href)})`;
        }
      }
      return text;
    })
    .join("");
}

export function renderInlineHtml(nodes: JSONContent[] | undefined): string {
  if (!nodes?.length) return "";

  return nodes
    .map((node) => {
      if (node.type === "hardBreak") return "<br />";
      if (node.type !== "text") {
        return renderInlineHtml(node.content);
      }

      let html = escapeHtml(node.text ?? "");
      const marks = (node.marks as Mark[] | undefined) ?? [];
      // Apply marks innermost-first as stored (usually fine for export)
      for (const mark of marks) {
        if (mark.type === "bold") html = `<strong>${html}</strong>`;
        if (mark.type === "italic") html = `<em>${html}</em>`;
        if (mark.type === "code") html = `<code>${html}</code>`;
        if (mark.type === "strike") html = `<s>${html}</s>`;
        if (mark.type === "link" && mark.attrs?.href) {
          const href = escapeHtml(String(mark.attrs.href));
          html = `<a href="${href}">${html}</a>`;
        }
      }
      return html;
    })
    .join("");
}
