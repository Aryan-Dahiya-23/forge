"use client";

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepComponent({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const { number, title } = node.attrs as { number: number; title: string };
  const titleId = `step-title-${node.attrs.number}`;

  return (
    <NodeViewWrapper
      className={cn(
        "group/step my-8 rounded-xl border border-border/60 bg-card transition-colors duration-150",
        selected
          ? "border-border ring-2 ring-ring/25"
          : "hover:border-border/80",
      )}
      data-type="step"
    >
      <div className="flex items-start gap-3 border-b border-border/45 px-4 py-3.5 sm:gap-3.5 sm:px-5 sm:py-4">
        <button
          type="button"
          contentEditable={false}
          draggable
          data-drag-handle
          className={cn(
            "mt-0.5 flex size-9 shrink-0 cursor-grab items-center justify-center rounded-full",
            "bg-foreground text-[0.8125rem] font-semibold tabular-nums text-background",
            "transition-opacity active:cursor-grabbing",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
          )}
          title="Drag to reorder"
          aria-label={`Step ${number}, drag to reorder`}
        >
          <span className="group-hover/step:hidden">{number}</span>
          <GripVertical
            className="hidden size-3.5 group-hover/step:block"
            strokeWidth={2}
          />
        </button>

        <div className="min-w-0 flex-1 pt-1">
          <label className="sr-only" htmlFor={titleId}>
            Step title
          </label>
          <input
            id={titleId}
            type="text"
            value={title}
            placeholder="Step title"
            contentEditable={false}
            onChange={(event) =>
              updateAttributes({ title: event.target.value })
            }
            className={cn(
              "w-full border-0 bg-transparent text-base font-semibold tracking-tight text-foreground outline-none",
              "placeholder:text-muted-foreground/45",
              "focus-visible:outline-none",
            )}
          />
        </div>

        <label
          className="mt-1.5 flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground"
          contentEditable={false}
        >
          <span className="sr-only">Step number</span>
          <input
            type="number"
            min={1}
            value={number}
            aria-label="Step number"
            onChange={(event) => {
              const next = Number(event.target.value);
              if (!Number.isNaN(next) && next >= 1) {
                updateAttributes({ number: next });
              }
            }}
            className={cn(
              "w-10 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-center text-[11px] tabular-nums text-muted-foreground",
              "opacity-0 transition-opacity duration-150 group-hover/step:opacity-100 focus:opacity-100",
              // Always visible on touch devices (no hover capability)
              "touch:opacity-100",
              "hover:border-border hover:bg-muted/50",
              "focus-visible:border-border focus-visible:bg-muted/50 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
            )}
          />
        </label>
      </div>

      <NodeViewContent className="step-content px-5 pt-4 pb-5 text-[0.95rem] leading-relaxed text-foreground sm:pl-[4.375rem] sm:pr-6 sm:pb-6" />
    </NodeViewWrapper>
  );
}
