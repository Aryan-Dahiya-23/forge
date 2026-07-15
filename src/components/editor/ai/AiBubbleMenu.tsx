"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Sparkles } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { AiAction } from "@/lib/ai/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { applyAiResult } from "./apply-ai-result";
import { streamAiRewrite } from "./stream-ai";

type AiBubbleMenuProps = {
  editor: Editor;
};

const ACTIONS: { action: AiAction; label: string; title: string }[] = [
  {
    action: "rewrite",
    label: "Rewrite",
    title: "Rephrase the selection",
  },
  {
    action: "expand",
    label: "Expand into steps",
    title: "Convert into structured Step nodes",
  },
  {
    action: "simplify",
    label: "Simplify",
    title: "Shorten and clarify the selection",
  },
];

export function AiBubbleMenu({ editor }: AiBubbleMenuProps) {
  const [busyAction, setBusyAction] = useState<AiAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runAction = useCallback(
    async (action: AiAction) => {
      const { from, to, empty } = editor.state.selection;
      if (empty || from === to) return;

      const text = editor.state.doc.textBetween(from, to, "\n\n").trim();
      if (!text) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setBusyAction(action);
      setError(null);
      setPreview(action === "expand" ? null : "…");

      try {
        const result = await streamAiRewrite({
          text,
          action,
          signal: controller.signal,
          onChunk: (accumulated) => {
            if (action !== "expand") {
              setPreview(
                accumulated.length > 160
                  ? `${accumulated.slice(0, 160)}…`
                  : accumulated,
              );
            }
          },
        });

        if (!result) {
          throw new Error("The model returned empty text.");
        }

        const docSize = editor.state.doc.content.size;
        const safeFrom = Math.min(from, docSize);
        const safeTo = Math.min(to, docSize);
        if (safeFrom >= safeTo) {
          throw new Error("Selection is no longer valid.");
        }

        applyAiResult({
          editor,
          action,
          from: safeFrom,
          to: safeTo,
          result,
        });
        setPreview(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : "AI action failed.";
        setError(message);
        setPreview(null);
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setBusyAction(null);
      }
    },
    [editor],
  );

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      shouldShow={({ editor: current, state }) => {
        const { empty, from, to } = state.selection;
        if (empty || from === to) return false;
        if (!current.isEditable) return false;
        const text = current.state.doc.textBetween(from, to, " ");
        return text.trim().length > 0;
      }}
      className={cn(
        "z-50 flex max-w-[min(100vw-2rem,28rem)] flex-col gap-1 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/10",
      )}
    >
      <div className="flex flex-wrap items-center gap-1">
        <Badge variant="secondary" className="gap-1 font-normal">
          <Sparkles className="size-3" />
          AI
        </Badge>
        {ACTIONS.map(({ action, label, title }) => {
          const busy = busyAction === action;
          const disabled = busyAction !== null;
          return (
            <Tooltip key={action}>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onMouseDown={(event) => {
                      // Keep selection from collapsing when clicking the menu.
                      event.preventDefault();
                    }}
                    onClick={() => {
                      void runAction(action);
                    }}
                  />
                }
              >
                {busy ? "Working…" : label}
              </TooltipTrigger>
              <TooltipContent>{title}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {busyAction && busyAction !== "expand" && preview && (
        <>
          <Separator />
          <p className="max-h-16 overflow-hidden px-2 py-1 text-[11px] leading-snug text-muted-foreground">
            {preview}
          </p>
        </>
      )}

      {busyAction === "expand" && (
        <>
          <Separator />
          <p className="px-2 py-1 text-[11px] text-muted-foreground">
            Building Step nodes…
          </p>
        </>
      )}

      {error && (
        <>
          <Separator />
          <p className="max-w-xs px-2 py-1 text-[11px] text-destructive">
            {error}
          </p>
        </>
      )}
    </BubbleMenu>
  );
}
