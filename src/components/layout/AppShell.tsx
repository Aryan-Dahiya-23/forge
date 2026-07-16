"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import type { DocumentListItem } from "@/lib/documents";
import { Button } from "@/components/ui/button";
import { DocumentSidebar } from "./DocumentSidebar";
import { cn } from "@/lib/utils";

type AppShellProps = {
  documents: DocumentListItem[];
  children: React.ReactNode;
};

/**
 * Minimal workspace: nav rail + main content.
 *
 * Desktop (md+): sidebar is permanently visible on the left.
 * Mobile (<md):  sidebar is hidden; a slim header bar with a hamburger
 *               button opens the sidebar inside a slide-over Sheet.
 */
export function AppShell({ documents, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-svh w-full overflow-hidden bg-background">
      {/* ── Mobile header bar (hidden on md+) ── */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-12 items-center gap-2 border-b border-border/45 bg-background/95 px-3 backdrop-blur-sm md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
          className="text-muted-foreground hover:text-foreground"
        >
          <Menu className="size-4" strokeWidth={1.75} />
        </Button>
        <Link
          href="/documents"
          className={cn(
            "truncate text-sm font-semibold tracking-tight text-foreground",
            "rounded-sm transition-opacity hover:opacity-80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
          )}
        >
          DocForge
        </Link>
      </header>

      {/* ── Sidebar: permanent on desktop, sheet on mobile ── */}
      <DocumentSidebar
        documents={documents}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* ── Main content area ── */}
      {/* pt-12 on mobile to clear the fixed header bar */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden pt-12 md:pt-0">
        {children}
      </div>
    </div>
  );
}
