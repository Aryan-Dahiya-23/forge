"use client";

import type { JSONContent } from "@tiptap/core";
import { Download, FileCode2, FileText, FileType2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportDocument, type ExportFormat } from "@/lib/export";

type ExportMenuProps = {
  title: string;
  getContent: () => JSONContent;
};

/**
 * Quiet export control — product formats, not a debug dump.
 */
export function ExportMenu({ title, getContent }: ExportMenuProps) {
  const [busy, setBusy] = useState(false);

  const runExport = async (format: ExportFormat) => {
    setBusy(true);
    const exportPromise = exportDocument({
      format,
      title,
      content: getContent(),
    });

    if (format === "pdf") {
      toast.promise(exportPromise, {
        loading: "Preparing PDF...",
        success: "PDF exported successfully.",
        error: "Couldn't export document.",
      });
    } else {
      exportPromise.catch(() => {
        toast.error("Couldn't export document.");
      });
    }

    try {
      await exportPromise;
    } catch {
      console.error("Export failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={busy}
            aria-label="Export document"
            title="Export"
            className="size-8 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          />
        }
      >
        <Download className="size-[1.125rem]" strokeWidth={1.75} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Export as
          </DropdownMenuLabel>
          <DropdownMenuItem
            disabled={busy}
            onClick={() => runExport("markdown")}
          >
            <FileText className="size-4" strokeWidth={1.75} />
            Markdown
          </DropdownMenuItem>
          <DropdownMenuItem disabled={busy} onClick={() => runExport("html")}>
            <FileCode2 className="size-4" strokeWidth={1.75} />
            HTML
          </DropdownMenuItem>
          <DropdownMenuItem disabled={busy} onClick={() => runExport("pdf")}>
            <FileType2 className="size-4" strokeWidth={1.75} />
            PDF
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
