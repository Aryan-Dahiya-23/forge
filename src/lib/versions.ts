import type { JSONContent } from "@tiptap/core";
import type { Prisma } from "@prisma/client";
import { EMPTY_DOC_CONTENT, isJsonContent } from "@/lib/documents";

export type VersionListItem = {
  id: string;
  documentId: string;
  createdAt: string;
  /** Short human label for the list */
  label: string;
  preview: string;
};

export type VersionDTO = {
  id: string;
  documentId: string;
  content: JSONContent;
  createdAt: string;
  label: string;
  preview: string;
};

export function toVersionListItem(
  version: {
    id: string;
    documentId: string;
    content: Prisma.JsonValue;
    createdAt: Date;
  },
  indexFromNewest: number,
): VersionListItem {
  const content = isJsonContent(version.content)
    ? version.content
    : EMPTY_DOC_CONTENT;

  return {
    id: version.id,
    documentId: version.documentId,
    createdAt: version.createdAt.toISOString(),
    label: `Snapshot ${indexFromNewest + 1}`,
    preview: contentPreview(content),
  };
}

export function toVersionDTO(
  version: {
    id: string;
    documentId: string;
    content: Prisma.JsonValue;
    createdAt: Date;
  },
  indexFromNewest: number,
): VersionDTO {
  const content = isJsonContent(version.content)
    ? version.content
    : EMPTY_DOC_CONTENT;

  return {
    ...toVersionListItem(version, indexFromNewest),
    content,
  };
}

/** Pull a short text teaser from TipTap JSON for the sidebar. */
export function contentPreview(content: JSONContent, maxLen = 80): string {
  const parts: string[] = [];

  const walk = (node: JSONContent) => {
    if (node.type === "text" && typeof node.text === "string") {
      parts.push(node.text);
      return;
    }
    if (node.type === "step") {
      const title =
        node.attrs && typeof node.attrs.title === "string"
          ? node.attrs.title
          : "";
      if (title) parts.push(title);
    }
    if (node.type === "screenshot") {
      const caption =
        node.attrs && typeof node.attrs.caption === "string"
          ? node.attrs.caption
          : "Screenshot";
      parts.push(caption || "Screenshot");
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) walk(child);
    }
  };

  walk(content);
  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  if (!text) return "Empty document";
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}
