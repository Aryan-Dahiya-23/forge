"use client";

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { GripVertical } from "lucide-react";
import type { CalloutVariant } from "./callout-extension";
import { cn } from "@/lib/utils";

const VARIANT_STYLES: Record<
  CalloutVariant,
  { container: string; badge: string; label: string }
> = {
  note: {
    container:
      "border-sky-200/80 bg-sky-50/80 dark:border-sky-900 dark:bg-sky-950/35",
    badge: "bg-sky-600/90 text-white",
    label: "Note",
  },
  tip: {
    container:
      "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/35",
    badge: "bg-emerald-600/90 text-white",
    label: "Tip",
  },
  warning: {
    container:
      "border-amber-200/80 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/35",
    badge: "bg-amber-600/90 text-white",
    label: "Warning",
  },
};

const VARIANTS: CalloutVariant[] = ["note", "tip", "warning"];

export function CalloutComponent({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const variant = (node.attrs.variant as CalloutVariant) || "note";
  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.note;

  return (
    <NodeViewWrapper
      className={cn(
        "group/callout relative my-8 rounded-xl border p-4 sm:p-5 transition-colors duration-150",
        styles.container,
        selected && "ring-2 ring-ring/25",
      )}
      data-type="callout"
      data-variant={variant}
    >
      <div
        className="mb-3 flex items-center justify-between gap-2"
        contentEditable={false}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            contentEditable={false}
            draggable
            data-drag-handle
            className={cn(
              "flex size-9 shrink-0 cursor-grab items-center justify-center rounded-full",
              "bg-muted/40 text-muted-foreground/75 transition-all duration-150 active:cursor-grabbing",
              "group-hover/callout:bg-foreground group-hover/callout:text-background",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
            )}
            title="Drag to reorder"
            aria-label="Drag callout to reorder"
          >
            <GripVertical className="size-3.5" strokeWidth={2} />
          </button>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              styles.badge,
            )}
          >
            {styles.label}
          </span>
        </div>
        <select
          value={variant}
          onChange={(event) =>
            updateAttributes({ variant: event.target.value as CalloutVariant })
          }
          className={cn(
            "rounded-md border border-transparent bg-background/60 px-2 py-1 text-xs text-foreground/80",
            "opacity-70 transition-opacity hover:opacity-100",
            "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
          )}
          aria-label="Callout type"
        >
          {VARIANTS.map((option) => (
            <option key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <NodeViewContent className="callout-content text-sm leading-relaxed text-foreground/90" />
    </NodeViewWrapper>
  );
}
