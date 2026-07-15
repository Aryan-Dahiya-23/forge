"use client";

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import {
  GripVertical,
  ImageIcon,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const MAX_FILE_BYTES = 1.5 * 1024 * 1024;

/**
 * First-class doc block — matches Step/Callout calm chrome, not an upload form.
 */
export function ScreenshotComponent({
  node,
  updateAttributes,
  selected,
  deleteNode,
}: NodeViewProps) {
  const { src, caption } = node.attrs as {
    src: string | null;
    caption: string;
  };
  const inputRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const applyFile = useCallback(
    (file: File | undefined | null) => {
      if (!file) return;
      setError(null);

      if (!file.type.startsWith("image/")) {
        setError("Use an image file (PNG, JPEG, WebP, or GIF).");
        toast.error("Upload failed.", { action: { label: "Retry", onClick: () => inputRef.current?.click() } });
        return;
      }

      if (file.size > MAX_FILE_BYTES) {
        setError("Image is larger than 1.5MB. Try a smaller file.");
        toast.error("Upload failed.", { action: { label: "Retry", onClick: () => inputRef.current?.click() } });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : null;
        if (!result) {
          setError("Could not read that file.");
          toast.error("Upload failed.", { action: { label: "Retry", onClick: () => inputRef.current?.click() } });
          return;
        }
        updateAttributes({ src: result });
      };
      reader.onerror = () => {
        setError("Could not read that file.");
        toast.error("Upload failed.", { action: { label: "Retry", onClick: () => inputRef.current?.click() } });
      };
      reader.readAsDataURL(file);
    },
    [updateAttributes],
  );

  useEffect(() => {
    if (!selected) return;

    const onPaste = (event: ClipboardEvent) => {
      if (captionRef.current && document.activeElement === captionRef.current) {
        return;
      }

      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            event.stopPropagation();
            applyFile(file);
            return;
          }
        }
      }
    };

    window.addEventListener("paste", onPaste, true);
    return () => window.removeEventListener("paste", onPaste, true);
  }, [selected, applyFile]);

  const openFilePicker = () => inputRef.current?.click();

  const onDragOver = (event: React.DragEvent) => {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.stopPropagation();
    setDragging(true);
  };

  const onDragLeave = (event: React.DragEvent) => {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.stopPropagation();
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }
    setDragging(false);
  };

  const onDrop = (event: React.DragEvent) => {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    applyFile(event.dataTransfer.files?.[0]);
  };

  return (
    <NodeViewWrapper
      className={cn(
        "group/screenshot relative my-8",
        selected && "rounded-xl ring-2 ring-ring/25",
      )}
      data-type="screenshot"
    >
      <div
        className={cn(
          "absolute top-3 left-3 z-10 transition-opacity duration-150",
          selected || dragging
            ? "opacity-100"
            : "opacity-0 group-hover/screenshot:opacity-100",
        )}
        contentEditable={false}
      >
        <button
          type="button"
          draggable
          data-drag-handle
          className={cn(
            "flex size-9 cursor-grab items-center justify-center rounded-full border border-border/50 bg-background/90 shadow-sm backdrop-blur-sm text-muted-foreground transition-all duration-150 active:cursor-grabbing",
            "hover:bg-foreground hover:text-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
          )}
          title="Drag to reorder"
          aria-label="Drag screenshot to reorder"
        >
          <GripVertical className="size-3.5" strokeWidth={2} />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          applyFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <figure className="m-0" contentEditable={false}>
        {src ? (
          <div
            className={cn(
              "relative overflow-hidden rounded-xl border border-border/70 bg-card transition-[border-color,box-shadow] duration-150",
              dragging && "border-foreground/20 bg-muted/30",
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={caption || "Screenshot"}
              className="mx-auto block max-h-[26rem] w-auto max-w-full object-contain"
              draggable={false}
            />

            <div
              className={cn(
                "absolute top-2 right-2 flex items-center gap-0.5 rounded-md border border-border/50 bg-background/90 p-0.5 shadow-sm backdrop-blur-sm transition-opacity duration-150",
                selected || dragging
                  ? "opacity-100"
                  : "opacity-0 group-hover/screenshot:opacity-100 focus-within:opacity-100",
              )}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                onClick={openFilePicker}
                aria-label="Replace image"
              >
                <RefreshCw className="size-3.5" strokeWidth={1.75} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      aria-label="More actions"
                    />
                  }
                >
                  <MoreHorizontal className="size-3.5" strokeWidth={1.75} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-40">
                  <DropdownMenuItem onClick={openFilePicker}>
                    <Upload className="size-4" strokeWidth={1.75} />
                    Replace image
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      updateAttributes({ src: null });
                      setError(null);
                    }}
                  >
                    <ImageIcon className="size-4" strokeWidth={1.75} />
                    Clear image
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => deleteNode()}
                  >
                    <Trash2 className="size-4" strokeWidth={1.75} />
                    Remove block
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 sm:py-14 text-center transition-colors duration-150",
              "border-border/50 bg-muted/10",
              "hover:border-border hover:bg-muted/25",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
              dragging && "border-foreground/30 bg-muted/35",
              selected && !dragging && "border-border",
            )}
          >
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-lg border border-border/55 bg-background",
                "transition-colors duration-150",
                dragging && "border-foreground/20",
              )}
            >
              <ImageIcon
                className="size-5 text-muted-foreground"
                strokeWidth={1.5}
              />
            </span>
            <span className="space-y-1">
              <span className="block text-sm font-medium tracking-tight text-foreground">
                {dragging ? "Drop image here" : "Add a screenshot"}
              </span>
              <span className="block text-xs leading-relaxed text-muted-foreground">
                Click to upload · Drag & drop · Paste from clipboard
              </span>
            </span>
          </button>
        )}

        {error && (
          <p className="mt-2 text-center text-xs text-destructive">{error}</p>
        )}

        <figcaption className="mt-2.5">
          <input
            ref={captionRef}
            type="text"
            value={caption}
            placeholder="Caption (optional)"
            onChange={(event) =>
              updateAttributes({ caption: event.target.value })
            }
            className={cn(
              "w-full border-0 bg-transparent text-center text-sm text-muted-foreground outline-none",
              "placeholder:text-muted-foreground/45",
              "focus:text-foreground",
            )}
          />
        </figcaption>
      </figure>
    </NodeViewWrapper>
  );
}
