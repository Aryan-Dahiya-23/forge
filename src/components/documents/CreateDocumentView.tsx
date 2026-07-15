"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2, Plus } from "lucide-react";
import type { DocumentTemplate, TemplateId } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CreateDocumentViewProps = {
  templates: Array<
    Pick<
      DocumentTemplate,
      "id" | "name" | "description" | "defaultTitle" | "highlights"
    >
  >;
};

/**
 * Create surface: New document (primary) + templates.
 * Recent docs live in the sidebar — not here.
 * Workflow step: Choose template → Write.
 */
export function CreateDocumentView({ templates }: CreateDocumentViewProps) {
  const router = useRouter();
  const [creatingId, setCreatingId] = useState<TemplateId | null>(null);

  const createFromTemplate = useCallback(
    async (templateId: TemplateId) => {
      setCreatingId(templateId);
      try {
        const response = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId }),
        });
        if (!response.ok) {
          throw new Error("Failed to create document.");
        }
        const data = (await response.json()) as {
          document: { id: string };
        };
        router.push(`/documents/${data.document.id}`);
        router.refresh();
      } catch {
        toast.error("Couldn't create document.");
        setCreatingId(null);
      }
    },
    [router],
  );

  const busy = creatingId !== null;
  const blank = templates.find((t) => t.id === "blank");
  const featured = templates.filter((t) => t.id !== "blank");

  return (
    /* Same content container as Editor: max-w-[52rem] + matching horizontal padding */
    <div className="mx-auto flex w-full max-w-[52rem] flex-col px-8 py-9 sm:px-14 sm:py-11">
      <section className="pb-10 border-b border-border/30">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          Start writing
        </p>
        <h1 className="mt-2.5 text-[1.875rem] font-semibold tracking-tight text-foreground sm:text-[2.125rem] sm:leading-[1.15]">
          Choose how to begin
        </h1>
        <p className="mt-3.5 max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">
          Open a blank page, or start from a structure. Then refine with AI and
          export when you&apos;re ready.
        </p>

        {blank && (
          <div className="mt-9">
            <Button
              type="button"
              size="lg"
              disabled={busy}
              className="min-w-[11rem] gap-2"
              onClick={() => void createFromTemplate(blank.id)}
            >
              {creatingId === blank.id ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
              ) : (
                <Plus className="size-4" strokeWidth={1.75} />
              )}
              {creatingId === blank.id ? "Opening…" : "New document"}
            </Button>
          </div>
        )}
      </section>

      <section className="pt-10">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Templates</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Structured SOPs you can edit immediately.
        </p>

        <ul className="mt-5 flex flex-col gap-3">
          {featured.map((template) => {
            const isCreating = creatingId === template.id;
            return (
              <li key={template.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void createFromTemplate(template.id)}
                  className={cn(
                    "group flex w-full items-center gap-5 rounded-xl border border-border/55 bg-background px-5 py-4 text-left sm:px-6 sm:py-[1.125rem]",
                    "transition-[background-color,border-color] duration-150",
                    "hover:border-border hover:bg-muted/25",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium tracking-tight text-foreground">
                        {template.name}
                      </p>
                      {template.highlights?.map((highlight) => (
                        <span
                          key={highlight}
                          className="inline-flex items-center rounded bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 text-[13px] leading-normal text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                    {isCreating ? (
                      <Loader2
                        className="size-4 animate-spin"
                        strokeWidth={1.75}
                      />
                    ) : (
                      <>
                        <span className="hidden sm:inline">Open</span>
                        <ArrowRight
                          className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
                          strokeWidth={1.75}
                        />
                      </>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
