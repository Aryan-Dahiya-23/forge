import type { JSONContent } from "@tiptap/core";
import type { Prisma } from "@prisma/client";

export type DocumentListItem = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentDTO = {
  id: string;
  title: string;
  content: JSONContent;
  createdAt: string;
  updatedAt: string;
};

export const EMPTY_DOC_CONTENT: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

/** Fallback when create is called without templateId or content. */
export function defaultNewDocumentContent(): JSONContent {
  return EMPTY_DOC_CONTENT;
}

export function isJsonContent(value: unknown): value is JSONContent {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as { type: unknown }).type === "doc"
  );
}

export function toDocumentDTO(doc: {
  id: string;
  title: string;
  content: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): DocumentDTO {
  const content = isJsonContent(doc.content)
    ? doc.content
    : EMPTY_DOC_CONTENT;

  return {
    id: doc.id,
    title: doc.title,
    content,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toListItem(doc: {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}): DocumentListItem {
  return {
    id: doc.id,
    title: doc.title,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
