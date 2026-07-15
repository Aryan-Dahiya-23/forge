"use client";

import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  Bold,
  Cloud,
  CloudOff,
  Heading2,
  History,
  Italic,
  List,
  Loader2,
  Redo2,
  Undo2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AiAssistant } from "./ai/AiAssistant";
import { ExportMenu } from "./ExportMenu";
import { createEditorExtensions } from "./extensions";
import { useAutosave, type SaveStatus } from "./use-autosave";
import { VersionHistory } from "./VersionHistory";

export type EditorProps = {
  documentId: string;
  initialTitle: string;
  initialContent: JSONContent;
};

/**
 * Document hero: title is chrome-only; body starts with content (no duplicate H1).
 * Doc-level actions (save, export, history) share one quiet cluster.
 */
export function Editor({
  documentId,
  initialTitle,
  initialContent,
}: EditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [contentRevision, setContentRevision] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [, setSelectionTick] = useState(0);

  const editor = useEditor({
    extensions: createEditorExtensions(),
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap max-w-none min-h-[min(60vh,36rem)] focus:outline-none",
      },
    },
    onUpdate: () => {
      setContentRevision((v) => v + 1);
    },
    onSelectionUpdate: () => {
      setSelectionTick((v) => v + 1);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const onTx = () => setSelectionTick((v) => v + 1);
    editor.on("transaction", onTx);
    return () => {
      editor.off("transaction", onTx);
    };
  }, [editor]);

  const getContent = useCallback((): JSONContent => {
    return editor?.getJSON() ?? initialContent;
  }, [editor, initialContent]);

  const onSaved = useCallback(() => {
    router.refresh();
  }, [router]);

  const { status, error, saveNow } = useAutosave({
    documentId,
    title,
    getContent,
    contentRevision,
    enabled: Boolean(editor),
    onSaved,
  });

  const handleRestore = useCallback(
    (content: JSONContent) => {
      if (!editor) return;
      editor.commands.setContent(content);
      setContentRevision((v) => v + 1);
    },
    [editor],
  );

  if (!editor) {
    return (
      <div
        className="flex flex-1 flex-col gap-4 px-8 py-10"
        aria-busy="true"
        aria-label="Loading document"
      >
        <div className="mx-auto w-full max-w-[52rem] space-y-4">
          <div className="h-9 w-2/3 animate-pulse rounded-md bg-muted/70" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted/50" />
          <div className="mt-6 space-y-2.5">
            <div className="h-3.5 w-full animate-pulse rounded bg-muted/40" />
            <div className="h-3.5 w-[92%] animate-pulse rounded bg-muted/40" />
            <div className="h-3.5 w-[80%] animate-pulse rounded bg-muted/40" />
          </div>
        </div>
      </div>
    );
  }

  const iconClass = "size-[1.125rem]";

  return (
    <div className="flex h-full min-h-0 flex-1">
      <div className="min-w-0 flex-1 overflow-y-auto">
        {/* ~max-w-3xl + ~100px for SOP breathing room, still not full-width */}
        <div className="mx-auto w-full max-w-[52rem] px-8 py-9 sm:px-14 sm:py-11">
          {/* Document chrome hierarchy: title → status/actions → toolbar → content */}
          <header className="mb-6 space-y-3">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Untitled"
              aria-label="Document title"
              className={cn(
                "h-auto min-w-0 w-full border-0 bg-transparent px-0 py-0.5",
                "text-[1.875rem] font-semibold tracking-tight shadow-none sm:text-[2.125rem] sm:leading-tight",
                "placeholder:text-muted-foreground/30",
                "focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
              )}
            />
            <div
              className="flex items-center justify-between border-b border-border/30 pb-3"
              role="group"
              aria-label="Document actions"
            >
              <div className="flex items-center">
                <SaveStatusLabel
                  status={status}
                  error={error}
                  onSave={saveNow}
                />
              </div>
              <div className="flex items-center gap-1">
                <ExportMenu title={title} getContent={getContent} />
                <ToolbarIcon
                  label={historyOpen ? "Hide history" : "Version history"}
                  active={historyOpen}
                  onClick={() => setHistoryOpen((open) => !open)}
                  icon={<History className={iconClass} strokeWidth={1.75} />}
                />
              </div>
            </div>
          </header>

          <div
            className="mb-4 mt-2 flex items-center gap-0.5 rounded-lg border border-border/35 bg-muted/5 p-1"
            role="toolbar"
            aria-label="Text formatting"
          >
            <ToolbarIcon
              label="Bold"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
              icon={<Bold className={iconClass} strokeWidth={1.75} />}
            />
            <ToolbarIcon
              label="Italic"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              icon={<Italic className={iconClass} strokeWidth={1.75} />}
            />
            <ToolbarIcon
              label="Heading"
              active={editor.isActive("heading", { level: 2 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              icon={<Heading2 className={iconClass} strokeWidth={1.75} />}
            />
            <ToolbarIcon
              label="Bullet list"
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              icon={<List className={iconClass} strokeWidth={1.75} />}
            />
            <span className="mx-2 h-4 w-px bg-border/60" aria-hidden />
            <ToolbarIcon
              label="Undo"
              onClick={() => editor.chain().focus().undo().run()}
              icon={<Undo2 className={iconClass} strokeWidth={1.75} />}
            />
            <ToolbarIcon
              label="Redo"
              onClick={() => editor.chain().focus().redo().run()}
              icon={<Redo2 className={iconClass} strokeWidth={1.75} />}
            />
          </div>

          <div className="relative pb-24">
            <EditorContent editor={editor} />
            <AiAssistant editor={editor} />
          </div>
        </div>
      </div>

      {historyOpen && (
        <aside
          className="flex w-64 shrink-0 flex-col border-l border-border/50 bg-muted/10"
          aria-label="Version history"
        >
          <div className="flex h-11 items-center px-4">
            <h2 className="text-sm font-medium text-foreground">History</h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            <VersionHistory
              documentId={documentId}
              getContent={getContent}
              onBeforeSnapshot={saveNow}
              onRestore={handleRestore}
              embedded
            />
          </div>
        </aside>
      )}
    </div>
  );
}

function ToolbarIcon({
  label,
  onClick,
  icon,
  active = false,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClick}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              "size-8 text-muted-foreground transition-colors duration-150 hover:bg-muted/70 hover:text-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring/30",
              active && "bg-muted text-foreground",
            )}
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function SaveStatusLabel({
  status,
  error,
  onSave,
}: {
  status: SaveStatus;
  error: string | null;
  onSave: () => Promise<void>;
}) {
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={() => void onSave()}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-destructive",
          "transition-colors hover:bg-destructive/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
        )}
        title={error ?? undefined}
      >
        <CloudOff className="size-3.5" strokeWidth={1.75} />
        Retry
      </button>
    );
  }

  if (status === "saving" || status === "dirty") {
    return (
      <span
        className="inline-flex h-8 items-center gap-1.5 px-2 text-xs text-muted-foreground"
        aria-live="polite"
      >
        <Loader2
          className={cn("size-3.5", status === "saving" && "animate-spin")}
          strokeWidth={1.75}
        />
        {status === "saving" ? "Saving" : "Editing"}
      </span>
    );
  }

  return (
    <span
      className="inline-flex h-8 items-center gap-1.5 px-2 text-xs text-muted-foreground/75"
      aria-live="polite"
    >
      <Cloud className="size-3.5 opacity-60" strokeWidth={1.75} />
      Saved
    </span>
  );
}
