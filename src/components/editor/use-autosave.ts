"use client";

import type { JSONContent } from "@tiptap/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 1500;

/**
 * Debounced PUT to /api/documents/[id] for title + TipTap JSON content.
 */
export function useAutosave(params: {
  documentId: string;
  title: string;
  getContent: () => JSONContent;
  /** Bump when content changes (e.g. editor onUpdate). */
  contentRevision: number;
  enabled?: boolean;
  /** Called after a successful save (e.g. refresh sidebar titles). */
  onSaved?: () => void;
}) {
  const {
    documentId,
    title,
    getContent,
    contentRevision,
    enabled = true,
    onSaved,
  } = params;

  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextRef = useRef(true);
  const titleRef = useRef(title);
  const documentIdRef = useRef(documentId);
  const getContentRef = useRef(getContent);

  useEffect(() => {
    titleRef.current = title;
    documentIdRef.current = documentId;
    getContentRef.current = getContent;
  }, [title, documentId, getContent]);

  const saveNow = useCallback(async () => {
    if (!enabled) return;

    setStatus("saving");
    setError(null);

    try {
      const response = await fetch(
        `/api/documents/${documentIdRef.current}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: titleRef.current,
            content: getContentRef.current(),
          }),
        },
      );

      if (!response.ok) {
        let message = `Save failed (${response.status})`;
        try {
          const data = (await response.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      setStatus("saved");
      setLastSavedAt(new Date());
      onSavedRef.current?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't save changes.";
      setError(message);
      setStatus("error");
      toast.error("Couldn't save changes.");
    }
  }, [enabled]);

  // Debounce on title or content changes; skip the initial mount snapshot.
  useEffect(() => {
    if (!enabled) return;

    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }

    setStatus("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      void saveNow();
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [title, contentRevision, enabled, saveNow]);

  // When switching documents, skip the next debounce tick (initial load).
  // Status resets via remounting Editor with key={documentId}.
  useEffect(() => {
    skipNextRef.current = true;
  }, [documentId]);

  return { status, lastSavedAt, error, saveNow };
}
