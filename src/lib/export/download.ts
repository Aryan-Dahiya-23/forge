import { slugifyFilename } from "./serialize";

export function downloadTextFile(params: {
  filename: string;
  content: string;
  mimeType: string;
}) {
  const blob = new Blob([params.content], { type: params.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = params.filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function buildExportFilename(title: string, extension: string): string {
  return `${slugifyFilename(title)}.${extension.replace(/^\./, "")}`;
}
