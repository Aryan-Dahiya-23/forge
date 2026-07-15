import type { JSONContent } from "@tiptap/core";
import { EMPTY_DOC_CONTENT } from "@/lib/documents";

export type TemplateId =
  | "blank"
  | "onboarding-checklist"
  | "troubleshooting-guide"
  | "feature-release-notes";

export type DocumentTemplate = {
  id: TemplateId;
  name: string;
  description: string;
  /** Default document title when creating from this template */
  defaultTitle: string;
  /** Short tags for UI chips */
  highlights: string[];
  content: JSONContent;
};

/**
 * Starter templates = TipTap document JSON scaffolds using custom Step/Callout nodes.
 * Spec §4.4 — reusable structured content, not a design system.
 */
export const TEMPLATES: DocumentTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Empty page — start writing immediately.",
    defaultTitle: "Untitled document",
    highlights: ["Empty"],
    content: EMPTY_DOC_CONTENT,
  },
  {
    id: "onboarding-checklist",
    name: "Onboarding Checklist",
    description: "Walk a new hire through day one, step by step.",
    defaultTitle: "Onboarding Checklist",
    highlights: ["Steps", "Callouts"],
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Walk a new engineer through their first day. Replace placeholder details with your team's stack and tools.",
            },
          ],
        },
        {
          type: "callout",
          attrs: { variant: "tip" },
          content: [
            {
              type: "text",
              text: "Assign a buddy before day one so none of these steps block on waiting for access.",
            },
          ],
        },
        {
          type: "step",
          attrs: { number: 1, title: "Provision accounts" },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Create email, Slack, and GitHub access. Confirm MFA is enabled before sharing credentials.",
                },
              ],
            },
          ],
        },
        {
          type: "step",
          attrs: { number: 2, title: "Clone the monorepo" },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Run the bootstrap script, install dependencies, and verify the local app starts on the default port.",
                },
              ],
            },
          ],
        },
        {
          type: "screenshot",
          attrs: {
            src: null,
            caption: "Screenshot: successful local app start (replace with yours)",
          },
        },
        {
          type: "step",
          attrs: { number: 3, title: "Review architecture docs" },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Read the system overview, service map, and deployment runbook. Note any questions for the buddy sync.",
                },
              ],
            },
          ],
        },
        {
          type: "step",
          attrs: { number: 4, title: "Ship a first PR" },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Pick a good-first-issue label, open a draft PR, and request review from the onboarding buddy.",
                },
              ],
            },
          ],
        },
        {
          type: "callout",
          attrs: { variant: "warning" },
          content: [
            {
              type: "text",
              text: "Never commit secrets or .env files. Rotate anything that was shared over chat.",
            },
          ],
        },
      ],
    },
  },
  {
    id: "troubleshooting-guide",
    name: "Troubleshooting Guide",
    description: "Capture symptoms and fix them with ordered steps.",
    defaultTitle: "Troubleshooting Guide",
    highlights: ["Steps", "Warning"],
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Use this guide when [symptom]. Capture what you tried so the next person can skip dead ends.",
            },
          ],
        },
        {
          type: "callout",
          attrs: { variant: "warning" },
          content: [
            {
              type: "text",
              text: "Do not restart production services without checking the on-call runbook and notifying the channel.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Symptoms" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Describe the user-visible failure, error codes, and when it started.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Resolution steps" }],
        },
        {
          type: "step",
          attrs: { number: 1, title: "Confirm the blast radius" },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Check status dashboards and recent deploys. Note which regions, tenants, or endpoints are affected.",
                },
              ],
            },
          ],
        },
        {
          type: "step",
          attrs: { number: 2, title: "Gather logs and traces" },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Pull request IDs, correlation IDs, and the last known good deploy SHA. Attach links in the incident thread.",
                },
              ],
            },
          ],
        },
        {
          type: "step",
          attrs: { number: 3, title: "Apply the known fix" },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Follow the standard remediation for this class of failure. Prefer reversible changes first.",
                },
              ],
            },
          ],
        },
        {
          type: "step",
          attrs: { number: 4, title: "Verify and document" },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Confirm metrics recover, run a smoke test, and update this guide if you found a new root cause.",
                },
              ],
            },
          ],
        },
        {
          type: "callout",
          attrs: { variant: "note" },
          content: [
            {
              type: "text",
              text: "If the issue is unresolved after these steps, escalate to the owning team with the evidence collected above.",
            },
          ],
        },
      ],
    },
  },
  {
    id: "feature-release-notes",
    name: "Feature Release Notes",
    description: "Announce a release, rollout checklist, and caveats.",
    defaultTitle: "Feature Release Notes",
    highlights: ["Steps", "Callouts"],
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Release: [name] · Version: [x.y.z] · Date: [YYYY-MM-DD]",
            },
          ],
        },
        {
          type: "callout",
          attrs: { variant: "tip" },
          content: [
            {
              type: "text",
              text: "Link the PR, design doc, and demo recording at the top so reviewers do not hunt for context.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "What’s new" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Summarize the user-facing change in 2–3 sentences. Call out who benefits.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Rollout checklist" }],
        },
        {
          type: "step",
          attrs: { number: 1, title: "Enable feature flag in staging" },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Flip the flag for internal users and verify happy-path + edge-case flows.",
                },
              ],
            },
          ],
        },
        {
          type: "step",
          attrs: { number: 2, title: "Ship to production" },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Deploy behind the flag, watch error budgets for 15 minutes, then ramp exposure.",
                },
              ],
            },
          ],
        },
        {
          type: "step",
          attrs: { number: 3, title: "Communicate the change" },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Post in #product-updates, update the changelog, and notify support with FAQs.",
                },
              ],
            },
          ],
        },
        {
          type: "callout",
          attrs: { variant: "warning" },
          content: [
            {
              type: "text",
              text: "Known issue: document any partial rollout limits, migrations, or temporary workarounds here.",
            },
          ],
        },
        {
          type: "callout",
          attrs: { variant: "note" },
          content: [
            {
              type: "text",
              text: "Rollback: disable the flag and redeploy the previous artifact if metrics breach SLO.",
            },
          ],
        },
      ],
    },
  },
];

export function getTemplate(id: string): DocumentTemplate | undefined {
  return TEMPLATES.find((template) => template.id === id);
}

export function isTemplateId(value: unknown): value is TemplateId {
  return (
    typeof value === "string" &&
    TEMPLATES.some((template) => template.id === value)
  );
}

/** Public list shape (includes content for clients that want offline create). */
export function listTemplates() {
  return TEMPLATES.map(({ id, name, description, defaultTitle, highlights, content }) => ({
    id,
    name,
    description,
    defaultTitle,
    highlights,
    content,
  }));
}
