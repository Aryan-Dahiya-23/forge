"use client";

import type { JSONContent } from "@tiptap/core";
import { Camera, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { VersionDTO, VersionListItem } from "@/lib/versions";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type VersionHistoryProps = {
  documentId: string;
  getContent: () => JSONContent;
  onRestore: (content: JSONContent) => void;
  onBeforeSnapshot?: () => Promise<void>;
  /** When true, omit outer card chrome (used inside a dialog). */
  embedded?: boolean;
};

export function VersionHistory({
  documentId,
  getContent,
  onRestore,
  onBeforeSnapshot,
  embedded = false,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<VersionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<VersionDTO | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<VersionListItem | null>(
    null,
  );

  const loadVersions = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`/api/documents/${documentId}/versions`);
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Couldn't load version history.");
      }
      const data = (await response.json()) as { versions: VersionListItem[] };
      setVersions(data.versions);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't load version history.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const response = await fetch(`/api/documents/${documentId}/versions`);
        if (cancelled) return;
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error ?? "Couldn't load version history.");
        }
        const data = (await response.json()) as { versions: VersionListItem[] };
        if (!cancelled) {
          setVersions(data.versions);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Couldn't load version history.";
          setError(msg);
          toast.error(msg);
          setLoading(false);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const createSnapshot = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await onBeforeSnapshot?.();
      const response = await fetch(`/api/documents/${documentId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: getContent() }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Couldn't create snapshot.");
      }
      await loadVersions();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't create snapshot.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }, [documentId, getContent, loadVersions, onBeforeSnapshot]);

  const viewVersion = useCallback(
    async (versionId: string) => {
      setViewLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/documents/${documentId}/versions/${versionId}`,
        );
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error ?? "Couldn't load snapshot.");
        }
        const data = (await response.json()) as { version: VersionDTO };
        setViewing(data.version);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Couldn't load snapshot.";
        setError(message);
        toast.error(message);
      } finally {
        setViewLoading(false);
      }
    },
    [documentId],
  );

  const restoreVersion = useCallback(
    async (versionId: string) => {
      setBusy(true);
      setError(null);
      try {
        await onBeforeSnapshot?.();
        const response = await fetch(
          `/api/documents/${documentId}/versions/${versionId}/restore`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ snapshotCurrent: true }),
          },
        );
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error ?? "Couldn't restore version.");
        }
        const data = (await response.json()) as {
          document: { content: JSONContent };
        };
        onRestore(data.document.content);
        setViewing(null);
        setRestoreTarget(null);
        await loadVersions();
        toast.success("Version restored successfully.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Couldn't restore version.";
        setError(message);
        toast.error(message);
      } finally {
        setBusy(false);
      }
    },
    [documentId, loadVersions, onBeforeSnapshot, onRestore],
  );

  return (
    <>
      <div className={cn("flex flex-col gap-3", !embedded && "p-1")}>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={busy}
          onClick={() => void createSnapshot()}
        >
          {busy ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <Camera data-icon="inline-start" />
          )}
          {busy ? "Working…" : "Save snapshot"}
        </Button>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : versions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-3 py-10 text-center">
            <p className="text-xs text-muted-foreground">
              No snapshots yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              Save one to pin this revision.
            </p>
          </div>
        ) : (
          <ScrollArea className={embedded ? "h-[min(50vh,22rem)]" : "h-[28rem]"}>
            <ul className="flex flex-col gap-0.5 pr-2">
              {versions.map((version) => (
                <li
                  key={version.id}
                  className="rounded-lg px-2.5 py-2.5 transition-colors duration-150 hover:bg-muted/50 focus-within:bg-muted/40"
                >
                  <p className="text-sm font-medium leading-none">
                    {version.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatWhen(version.createdAt)}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
                    {version.preview}
                  </p>
                  <div className="mt-2 flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      disabled={busy || viewLoading}
                      onClick={() => void viewVersion(version.id)}
                    >
                      View
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      disabled={busy}
                      onClick={() => setRestoreTarget(version)}
                    >
                      Restore
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </div>

      <Dialog
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton>
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.label}</DialogTitle>
                <DialogDescription>
                  {formatWhen(viewing.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {viewing.preview}
              </p>
              <DialogFooter>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => setRestoreTarget(viewing)}
                >
                  Restore this version
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={restoreTarget !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setRestoreTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this version?</AlertDialogTitle>
            <AlertDialogDescription>
              {restoreTarget
                ? `Your current draft will be snapshotted first, then replaced with “${restoreTarget.label}”.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || !restoreTarget}
              onClick={() => {
                if (restoreTarget) void restoreVersion(restoreTarget.id);
              }}
            >
              {busy ? "Restoring…" : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
