"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useState, useLayoutEffect } from "react";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import type { DocumentListItem } from "@/lib/documents";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type DocumentSidebarProps = {
  documents: DocumentListItem[];
};

/**
 * Slim navigation rail — library only, not a dashboard.
 */
export function DocumentSidebar({ documents }: DocumentSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const activeId =
    typeof params?.id === "string" ? params.id : undefined;

  const [deleteTarget, setDeleteTarget] = useState<DocumentListItem | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/documents/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) {
        throw new Error("Failed to delete");
      }
      const deletedId = deleteTarget.id;
      setDeleteTarget(null);
      if (activeId === deletedId) {
        router.push("/documents");
      }
      router.refresh();
      toast("Document deleted");
    } catch {
      toast.error("Couldn't delete document.");
      // keep dialog open
    } finally {
      setDeleting(false);
    }
  }, [activeId, deleteTarget, router]);

  const isCreateView = pathname === "/documents" || pathname === "/documents/";

  return (
    <>
      <aside
        className="flex h-svh w-56 shrink-0 flex-col border-r border-border/45 bg-muted/10"
        aria-label="Documents"
      >
        <div className="flex h-12 items-center justify-between gap-1 px-4 border-b border-border/15">
          <Link
            href="/documents"
            className={cn(
              "truncate text-sm font-semibold tracking-tight text-foreground",
              "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
            )}
          >
            DocForge
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {!mounted ? (
              <span className="size-4" />
            ) : resolvedTheme === "dark" ? (
              <Sun className="size-4" strokeWidth={1.75} />
            ) : (
              <Moon className="size-4" strokeWidth={1.75} />
            )}
          </Button>
        </div>

        <div className="px-2 py-2 border-b border-border/10">
          <Link
            href="/documents"
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors duration-150 border border-border/40 shadow-xs",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
              isCreateView
                ? "bg-foreground/[0.05] text-foreground border-border/80"
                : "bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border/60",
            )}
          >
            <Plus className="size-3.5 shrink-0" strokeWidth={2} />
            New document
          </Link>
        </div>

        <p className="px-4 pt-3.5 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
          Documents
        </p>

        <ScrollArea className="min-h-0 flex-1 px-2 pb-3">
          {documents.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs leading-relaxed text-muted-foreground">
              No documents yet
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {documents.map((doc) => {
                const isActive = doc.id === activeId;
                return (
                  <li key={doc.id} className="group relative">
                    <Link
                      href={`/documents/${doc.id}`}
                      className={cn(
                        "flex flex-col gap-0 rounded-md py-1.5 pr-7 pl-2 border border-transparent transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                        isActive
                          ? "bg-foreground/[0.05] border-border/40 font-medium text-foreground"
                          : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <FileText
                          className={cn(
                            "size-3.5 shrink-0",
                            isActive
                              ? "text-foreground/70"
                              : "text-muted-foreground/70",
                          )}
                          strokeWidth={1.75}
                        />
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-[13px] leading-snug",
                            isActive && "font-medium",
                          )}
                        >
                          {doc.title || "Untitled"}
                        </span>
                      </span>
                      <span className="truncate pl-5 text-[10px] tabular-nums text-muted-foreground/70">
                        {formatRelative(doc.updatedAt)}
                      </span>
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className={cn(
                        "absolute right-1.5 top-0 bottom-0 my-auto text-muted-foreground hover:text-destructive",
                        "opacity-0 transition-opacity duration-150",
                        "group-hover:opacity-100 group-focus-visible:opacity-100 focus-visible:opacity-100",
                      )}
                      aria-label={`Delete ${doc.title}`}
                      onClick={() => setDeleteTarget(doc)}
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.75} />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </aside>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.title || "Untitled"}” will be permanently deleted.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function formatRelative(iso: string): string {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}
