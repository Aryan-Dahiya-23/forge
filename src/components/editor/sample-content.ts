import type { JSONContent } from "@tiptap/core";
import { getTemplate } from "@/lib/templates";

/**
 * @deprecated Prefer templates from `@/lib/templates`.
 * Kept as a stable import for any leftover references; mirrors onboarding checklist.
 */
export const sampleDocument: JSONContent =
  getTemplate("onboarding-checklist")?.content ?? {
    type: "doc",
    content: [{ type: "paragraph" }],
  };
