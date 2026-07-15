import type { JSONContent } from "@tiptap/core";
import {
  escapeHtml,
  getText,
  renderInlineHtml,
} from "./serialize";

/**
 * Serialize TipTap JSON to a full standalone HTML document
 * (suitable for download and print-to-PDF).
 */
export function documentToHtmlDocument(
  doc: JSONContent,
  title?: string,
): string {
  const docTitle = title?.trim() || "Untitled";
  const body = documentToHtmlFragment(doc);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(docTitle)}</title>
  <style>${EXPORT_STYLES}</style>
</head>
<body>
  <article class="document">
    <header class="document-header">
      <h1 class="document-title">${escapeHtml(docTitle)}</h1>
    </header>
    <div class="document-body">
${body}
    </div>
  </article>
</body>
</html>
`;
}

/** Body fragment only (no document shell). */
export function documentToHtmlFragment(doc: JSONContent): string {
  return (doc.content ?? [])
    .map((node) => blockToHtml(node))
    .filter(Boolean)
    .join("\n");
}

function blockToHtml(node: JSONContent): string {
  switch (node.type) {
    case "paragraph": {
      const inner = renderInlineHtml(node.content);
      return `<p>${inner || "<br />"}</p>`;
    }
    case "heading": {
      const level = Math.min(
        6,
        Math.max(1, Number(node.attrs?.level) || 1),
      );
      const inner = renderInlineHtml(node.content);
      return `<h${level}>${inner}</h${level}>`;
    }
    case "bulletList":
      return `<ul>${(node.content ?? []).map(listItemToHtml).join("")}</ul>`;
    case "orderedList": {
      const start = Number(node.attrs?.start) || 1;
      const startAttr = start !== 1 ? ` start="${start}"` : "";
      return `<ol${startAttr}>${(node.content ?? []).map(listItemToHtml).join("")}</ol>`;
    }
    case "blockquote": {
      const inner = (node.content ?? []).map(blockToHtml).join("");
      return `<blockquote>${inner}</blockquote>`;
    }
    case "codeBlock": {
      const code = escapeHtml(getText(node));
      const lang = node.attrs?.language
        ? ` class="language-${escapeHtml(String(node.attrs.language))}"`
        : "";
      return `<pre><code${lang}>${code}</code></pre>`;
    }
    case "horizontalRule":
      return "<hr />";
    case "step": {
      const number = Number(node.attrs?.number) || 1;
      const stepTitle = escapeHtml(
        String(node.attrs?.title ?? "").trim() || "Step",
      );
      const body = (node.content ?? []).map(blockToHtml).join("");
      return `<section class="step" data-number="${number}">
  <h3 class="step-heading"><span class="step-number">${number}</span> ${stepTitle}</h3>
  <div class="step-body">${body}</div>
</section>`;
    }
    case "callout": {
      const variant = escapeHtml(String(node.attrs?.variant ?? "note"));
      const label = variant.charAt(0).toUpperCase() + variant.slice(1);
      const inner = renderInlineHtml(node.content);
      return `<aside class="callout callout-${variant}" data-variant="${variant}">
  <div class="callout-label">${escapeHtml(label)}</div>
  <div class="callout-body">${inner}</div>
</aside>`;
    }
    case "screenshot": {
      const src = node.attrs?.src ? String(node.attrs.src) : "";
      const caption = String(node.attrs?.caption ?? "").trim();
      if (!src) {
        return `<figure class="screenshot screenshot-empty">
  <div class="screenshot-placeholder">Screenshot</div>
  ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}
</figure>`;
      }
      return `<figure class="screenshot">
  <img src="${escapeHtml(src)}" alt="${escapeHtml(caption || "Screenshot")}" />
  ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}
</figure>`;
    }
    default: {
      if (node.content?.length) {
        return node.content.map(blockToHtml).join("");
      }
      const text = escapeHtml(getText(node).trim());
      return text ? `<p>${text}</p>` : "";
    }
  }
}

function listItemToHtml(item: JSONContent): string {
  const inner = (item.content ?? []).map(blockToHtml).join("");
  return `<li>${inner}</li>`;
}

const EXPORT_STYLES = `
  :root {
    color-scheme: light;
    --text: #171717;
    --muted: #52525b;
    --border: #e4e4e7;
    --surface: #fafafa;
    --step: #2563eb;
    --tip: #059669;
    --warning: #d97706;
    --note: #0284c7;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 2.5rem 1.5rem 4rem;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.65;
    color: var(--text);
    background: #fff;
  }
  .document {
    max-width: 42rem;
    margin: 0 auto;
  }
  .document-title {
    margin: 0 0 1.75rem;
    font-size: 1.85rem;
    font-weight: 650;
    letter-spacing: -0.03em;
    line-height: 1.2;
  }
  .document-body > * + * { margin-top: 0.85rem; }
  h1, h2, h3, h4 {
    line-height: 1.25;
    letter-spacing: -0.02em;
    font-weight: 600;
  }
  h1 { font-size: 1.5rem; margin: 1.75rem 0 0.6rem; }
  h2 { font-size: 1.25rem; margin: 1.5rem 0 0.5rem; }
  h3 { font-size: 1.05rem; margin: 1.25rem 0 0.4rem; }
  p { margin: 0.5rem 0; }
  ul, ol { margin: 0.5rem 0; padding-left: 1.35rem; }
  li { margin: 0.25rem 0; }
  li > p { margin: 0.2rem 0; }
  blockquote {
    margin: 0.85rem 0;
    padding: 0.15rem 0 0.15rem 1rem;
    border-left: 3px solid var(--border);
    color: var(--muted);
  }
  pre {
    margin: 0.85rem 0;
    padding: 0.85rem 1rem;
    overflow-x: auto;
    border-radius: 0.5rem;
    background: #18181b;
    color: #f4f4f5;
    font-size: 0.875rem;
  }
  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.9em;
  }
  p code {
    padding: 0.1em 0.3em;
    border-radius: 0.25rem;
    background: var(--surface);
  }
  hr {
    border: 0;
    border-top: 1px solid var(--border);
    margin: 1.5rem 0;
  }
  a { color: #1d4ed8; }

  .step {
    margin: 1.15rem 0;
    padding: 1rem 1.1rem 1rem 1.15rem;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    background: #fff;
  }
  .step-heading {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin: 0 0 0.5rem;
    font-size: 1rem;
    font-weight: 600;
  }
  .step-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 999px;
    background: var(--step);
    color: #fff;
    font-size: 0.8rem;
    font-weight: 650;
    flex-shrink: 0;
  }
  .step-body > *:first-child { margin-top: 0; }
  .step-body > *:last-child { margin-bottom: 0; }

  .callout {
    margin: 1rem 0;
    padding: 0.85rem 1rem;
    border-radius: 0.65rem;
    border: 1px solid var(--border);
    background: var(--surface);
  }
  .callout-label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 0.35rem;
  }
  .callout-note { border-color: color-mix(in srgb, var(--note) 35%, var(--border)); background: color-mix(in srgb, var(--note) 8%, white); }
  .callout-note .callout-label { color: var(--note); }
  .callout-tip { border-color: color-mix(in srgb, var(--tip) 35%, var(--border)); background: color-mix(in srgb, var(--tip) 8%, white); }
  .callout-tip .callout-label { color: var(--tip); }
  .callout-warning { border-color: color-mix(in srgb, var(--warning) 35%, var(--border)); background: color-mix(in srgb, var(--warning) 10%, white); }
  .callout-warning .callout-label { color: var(--warning); }

  .screenshot {
    margin: 1.25rem 0;
    text-align: center;
  }
  .screenshot img {
    max-width: 100%;
    max-height: 28rem;
    height: auto;
    border-radius: 0.65rem;
    border: 1px solid var(--border);
  }
  .screenshot figcaption {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: var(--muted);
  }
  .screenshot-placeholder {
    padding: 2.5rem 1rem;
    border: 1px dashed var(--border);
    border-radius: 0.65rem;
    color: var(--muted);
    font-size: 0.9rem;
    background: var(--surface);
  }

  @media print {
    body { padding: 0; }
    .step, .callout, .screenshot img { break-inside: avoid; }
    a { color: inherit; text-decoration: none; }
  }
`;
