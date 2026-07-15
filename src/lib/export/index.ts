import type { JSONContent } from "@tiptap/core";
import { buildExportFilename, downloadTextFile } from "./download";
import { documentToHtmlDocument } from "./html";
import { documentToMarkdown } from "./markdown";
import { exportHtmlAsPdf } from "./pdf";

export type ExportFormat = "markdown" | "html" | "pdf";

export async function exportDocument(params: {
  format: ExportFormat;
  title: string;
  content: JSONContent;
}): Promise<void> {
  const title = params.title.trim() || "Untitled";
  const { content, format } = params;

  if (format === "markdown") {
    const markdown = documentToMarkdown(content, title);
    downloadTextFile({
      filename: buildExportFilename(title, "md"),
      content: markdown,
      mimeType: "text/markdown;charset=utf-8",
    });
    return;
  }

  const html = documentToHtmlDocument(content, title);

  if (format === "html") {
    downloadTextFile({
      filename: buildExportFilename(title, "html"),
      content: html,
      mimeType: "text/html;charset=utf-8",
    });
    return;
  }

  await exportHtmlAsPdf(html, title);
}

export { documentToMarkdown } from "./markdown";
export { documentToHtmlDocument, documentToHtmlFragment } from "./html";
