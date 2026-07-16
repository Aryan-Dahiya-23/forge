"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import type { SlashCommandItem } from "./slash-items";

export type SlashCommandListProps = {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
};

export type SlashCommandListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

/**
 * Floating slash menu — keyboard-first, quiet product styling.
 */
export const SlashCommandList = forwardRef<
  SlashCommandListRef,
  SlashCommandListProps
>(function SlashCommandList({ items, command }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${selectedIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((index) =>
            items.length === 0 ? 0 : (index + items.length - 1) % items.length,
          );
          return true;
        }

        if (event.key === "ArrowDown") {
          setSelectedIndex((index) =>
            items.length === 0 ? 0 : (index + 1) % items.length,
          );
          return true;
        }

        if (event.key === "Enter") {
          const item = items[selectedIndex];
          if (item) {
            command(item);
          }
          return true;
        }

        return false;
      },
    }),
    [items, selectedIndex, command],
  );

  if (items.length === 0) {
    return (
      <div className="w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border/80 bg-popover px-3 py-6 text-center text-sm text-muted-foreground shadow-lg">
        No matching commands
      </div>
    );
  }

  let lastGroup: SlashCommandItem["group"] | null = null;

  return (
    <div
      ref={listRef}
      className="z-50 max-h-80 w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-border/80 bg-popover p-1 text-popover-foreground shadow-lg"
      role="listbox"
      aria-label="Insert block"
      id="slash-command-list"
    >
      {items.map((item, index) => {
        const showGroupHeader = item.group !== lastGroup;
        lastGroup = item.group;
        const isSelected = index === selectedIndex;
        const optionId = `slash-item-${index}`;

        return (
          <div key={`${item.group}-${item.title}`}>
            {showGroupHeader && (
              <div className="px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {item.group === "blocks" ? "Blocks" : "Format"}
              </div>
            )}
            <button
              type="button"
              id={optionId}
              data-index={index}
              role="option"
              aria-selected={isSelected}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors duration-100",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                isSelected
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-muted/80",
              )}
              onClick={() => command(item)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border text-xs font-medium",
                  item.group === "blocks"
                    ? "border-border/80 bg-background text-foreground"
                    : "border-border/60 bg-muted/60 text-muted-foreground",
                )}
                aria-hidden
              >
                {item.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium leading-tight">
                  {item.title}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-xs leading-snug",
                    isSelected
                      ? "text-accent-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {item.description}
                </span>
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
});
