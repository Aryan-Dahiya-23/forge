"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Check,
  Loader2,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import type { AiAction } from "@/lib/ai/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { applyAiResult, parseExpandSteps } from "./apply-ai-result";
import { streamAiRewrite } from "./stream-ai";

type AiAssistantProps = {
  editor: Editor;
};

type SessionPhase = "generating" | "ready" | "error";

type AiSession = {
  action: AiAction;
  from: number;
  to: number;
  originalText: string;
  draft: string;
  phase: SessionPhase;
  error: string | null;
};

const ACTIONS: { action: AiAction; label: string; description: string }[] = [
  {
    action: "rewrite",
    label: "Rewrite",
    description: "Rephrase the selection",
  },
  {
    action: "expand",
    label: "Expand into steps",
    description: "Turn into Step blocks",
  },
  {
    action: "simplify",
    label: "Simplify",
    description: "Shorten and clarify",
  },
];

const ACTION_LABEL: Record<AiAction, string> = {
  rewrite: "Rewrite",
  expand: "Expand into steps",
  simplify: "Simplify",
};

const PANEL_WIDTH = 380;
const PANEL_MAX_HEIGHT = 320;
const VIEWPORT_PAD = 12;

/**
 * Selection bubble to start an action; floating review panel near the selection
 * for streaming + accept/discard. Document mutates only on Accept.
 */
export function AiAssistant({ editor }: AiAssistantProps) {
  const [session, setSession] = useState<AiSession | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const editableBeforeRef = useRef(true);

  const clearSession = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSession(null);
    if (editor.isEditable !== editableBeforeRef.current) {
      editor.setEditable(editableBeforeRef.current);
    }
  }, [editor]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const startAction = useCallback(
    async (action: AiAction) => {
      const { from, to, empty } = editor.state.selection;
      if (empty || from === to) return;

      const originalText = editor.state.doc
        .textBetween(from, to, "\n\n")
        .trim();
      if (!originalText) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      editableBeforeRef.current = editor.isEditable;
      editor.setEditable(false);

      // Keep selection in view before the panel appears
      try {
        const domAt = editor.view.domAtPos(from);
        const node =
          domAt.node.nodeType === Node.TEXT_NODE
            ? domAt.node.parentElement
            : (domAt.node as HTMLElement);
        node?.scrollIntoView?.({ block: "center", behavior: "smooth" });
      } catch {
        // ignore
      }

      setSession({
        action,
        from,
        to,
        originalText,
        draft: "",
        phase: "generating",
        error: null,
      });

      try {
        const result = await streamAiRewrite({
          text: originalText,
          action,
          signal: controller.signal,
          onChunk: (accumulated) => {
            setSession((prev) =>
              prev && prev.action === action
                ? { ...prev, draft: accumulated, phase: "generating" }
                : prev,
            );
          },
        });

        if (controller.signal.aborted) return;

        if (!result) {
          throw new Error("The model returned empty text.");
        }

        setSession((prev) =>
          prev && prev.action === action
            ? { ...prev, draft: result, phase: "ready", error: null }
            : prev,
        );
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          err instanceof Error ? err.message : "AI action failed.";
        setSession((prev) =>
          prev && prev.action === action
            ? { ...prev, phase: "error", error: message }
            : prev,
        );
        toast.error("AI is currently unavailable.");
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [editor],
  );

  const accept = useCallback(() => {
    if (!session || session.phase === "generating") return;

    const draft = session.draft.trim();
    if (!draft && session.phase !== "error") return;

    try {
      editor.setEditable(true);
      applyAiResult({
        editor,
        action: session.action,
        from: session.from,
        to: session.to,
        result: draft,
      });
      setSession(null);
      abortRef.current = null;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not apply result.";
      setSession((prev) =>
        prev ? { ...prev, phase: "error", error: message } : prev,
      );
      editor.setEditable(false);
    }
  }, [editor, session]);

  const discard = useCallback(() => {
    const from = session?.from ?? 0;
    clearSession();
    editor.chain().focus().setTextSelection(from).run();
  }, [clearSession, editor, session?.from]);

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSession((prev) => {
      if (!prev) return prev;
      if (prev.draft.trim()) {
        return { ...prev, phase: "ready", error: null };
      }
      return { ...prev, phase: "error", error: "Generation stopped." };
    });
  }, []);

  const hasSession = session !== null;

  return (
    <>
      <BubbleMenu
        editor={editor}
        options={{ placement: "top", offset: 6 }}
        shouldShow={({ editor: current, state }) => {
          if (hasSession) return false;
          const { empty, from, to } = state.selection;
          if (empty || from === to) return false;
          if (!current.isEditable) return false;
          const text = current.state.doc.textBetween(from, to, " ");
          return text.trim().length > 0;
        }}
        className="z-50 flex items-center gap-0.5 rounded-lg border border-border/70 bg-background/95 p-1 shadow-md backdrop-blur-sm"
      >
        <span className="flex items-center gap-1 px-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5" strokeWidth={1.75} />
          AI
        </span>
        <Separator orientation="vertical" className="mx-0.5 h-4" />
        {ACTIONS.map(({ action, label, description }) => (
          <Tooltip key={action}>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs transition-colors"
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => {
                    void startAction(action);
                  }}
                />
              }
            >
              {label}
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              {description}
            </TooltipContent>
          </Tooltip>
        ))}
      </BubbleMenu>

      {session &&
        typeof document !== "undefined" &&
        createPortal(
          <AiReviewPanel
            editor={editor}
            session={session}
            onAccept={accept}
            onDiscard={discard}
            onStop={stopGenerating}
            onRetry={() => void startAction(session.action)}
          />,
          document.body,
        )}
    </>
  );
}

function clampPanelPosition(
  editor: Editor,
  from: number,
  to: number,
  panelHeight: number = 200,
): { top: number; left: number; width: number; maxHeight: number } {
  const width = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_PAD * 2);
  const maxHeight = Math.min(
    PANEL_MAX_HEIGHT,
    window.innerHeight - VIEWPORT_PAD * 2,
  );

  let selTop = 80;
  let selBottom = 120;
  let selLeft = VIEWPORT_PAD;

  try {
    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(Math.max(from, to - 1));
    selTop = Math.min(start.top, end.top);
    selBottom = Math.max(start.bottom, end.bottom);
    selLeft = Math.min(start.left, end.left);
  } catch {
    // fallback near top of viewport
  }

  // Prefer rendering below selection
  let top = selBottom + 8;
  const spaceBelow = window.innerHeight - selBottom - VIEWPORT_PAD - 8;
  const spaceAbove = selTop - VIEWPORT_PAD - 8;

  if (spaceBelow < panelHeight && spaceAbove > spaceBelow) {
    // Flip above selection
    top = selTop - panelHeight - 8;
  }

  // Clamp top to viewport limits
  top = Math.max(
    VIEWPORT_PAD,
    Math.min(top, window.innerHeight - panelHeight - VIEWPORT_PAD),
  );

  // Align horizontally and clamp
  let left = selLeft;
  left = Math.max(
    VIEWPORT_PAD,
    Math.min(left, window.innerWidth - width - VIEWPORT_PAD),
  );

  return { top, left, width, maxHeight };
}

function AiReviewPanel({
  editor,
  session,
  onAccept,
  onDiscard,
  onStop,
  onRetry,
}: {
  editor: Editor;
  session: AiSession;
  onAccept: () => void;
  onDiscard: () => void;
  onStop: () => void;
  onRetry: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  const applyPosition = useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    const panelHeight = el.offsetHeight || 220;
    const pos = clampPanelPosition(editor, session.from, session.to, panelHeight);
    el.style.top = `${pos.top}px`;
    el.style.left = `${pos.left}px`;
    el.style.width = `${pos.width}px`;
    el.style.maxHeight = `${pos.maxHeight}px`;
  }, [editor, session.from, session.to]);

  useLayoutEffect(() => {
    applyPosition();
    panelRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [applyPosition, session.phase]);

  useEffect(() => {
    window.addEventListener("resize", applyPosition);
    window.addEventListener("scroll", applyPosition, true);
    return () => {
      window.removeEventListener("resize", applyPosition);
      window.removeEventListener("scroll", applyPosition, true);
    };
  }, [applyPosition]);

  const isGenerating = session.phase === "generating";
  const isReady = session.phase === "ready";
  const isError = session.phase === "error";
  const canAccept =
    isReady &&
    session.draft.trim().length > 0 &&
    (session.action !== "expand" ||
      parseExpandSteps(session.draft).length > 0);

  const expandPreview =
    session.action === "expand" ? parseExpandSteps(session.draft) : null;

  const initial = clampPanelPosition(editor, session.from, session.to);

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-[100] flex flex-col overflow-hidden rounded-xl border border-border/70 bg-background shadow-xl",
        "animate-in fade-in-0 zoom-in-95 duration-150",
      )}
      style={{
        top: initial.top,
        left: initial.left,
        width: initial.width,
        maxHeight: initial.maxHeight,
      }}
      role="dialog"
      aria-label="AI suggestion"
      aria-live="polite"
      aria-modal="false"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/50 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {isGenerating ? (
            <Loader2
              className="size-3.5 shrink-0 animate-spin text-muted-foreground"
              strokeWidth={1.75}
            />
          ) : (
            <Sparkles
              className="size-3.5 shrink-0 text-muted-foreground"
              strokeWidth={1.75}
            />
          )}
          <span className="truncate text-xs font-medium text-foreground">
            {ACTION_LABEL[session.action]}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {isGenerating
              ? "Generating…"
              : isError
                ? "Something went wrong"
                : "Review suggestion"}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground"
          onClick={onDiscard}
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {isError && !session.draft ? (
          <p className="text-sm text-destructive">
            {session.error ?? "Generation failed."}
          </p>
        ) : expandPreview && expandPreview.length > 0 && !isGenerating ? (
          <ol className="space-y-2.5">
            {expandPreview.map((step, index) => (
              <li key={`${step.title}-${index}`} className="text-sm">
                <span className="font-medium text-foreground">
                  {index + 1}. {step.title}
                </span>
                {step.body ? (
                  <p className="mt-0.5 leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p
            className={cn(
              "whitespace-pre-wrap text-sm leading-relaxed text-foreground",
              isGenerating && "text-foreground/90",
            )}
          >
            {session.draft || (
              <span className="text-muted-foreground">
                {isGenerating ? "Thinking…" : "No suggestion yet."}
              </span>
            )}
            {isGenerating && session.draft ? (
              <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-foreground/70 align-middle" />
            ) : null}
          </p>
        )}

        {isError && session.error && session.draft ? (
          <p className="mt-2 text-xs text-destructive">{session.error}</p>
        ) : null}

        {isReady &&
          session.action === "expand" &&
          expandPreview?.length === 0 &&
          session.draft && (
            <p className="mt-2 text-xs text-destructive">
              Could not parse steps from the response. Discard and try again.
            </p>
          )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border/50 bg-muted/20 px-3 py-2">
        {isGenerating ? (
          <Button type="button" variant="outline" size="sm" onClick={onStop}>
            <Square className="size-3 fill-current" data-icon="inline-start" />
            Stop
          </Button>
        ) : (
          <>
            <Button type="button" variant="ghost" size="sm" onClick={onDiscard}>
              Discard
            </Button>
            {isError ? (
              <Button type="button" size="sm" onClick={onRetry}>
                Try again
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={!canAccept}
                onClick={onAccept}
              >
                <Check data-icon="inline-start" />
                Accept
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
