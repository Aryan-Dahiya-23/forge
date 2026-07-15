import type { DocumentListItem } from "@/lib/documents";
import { DocumentSidebar } from "./DocumentSidebar";

type AppShellProps = {
  documents: DocumentListItem[];
  children: React.ReactNode;
};

/**
 * Minimal workspace: nav rail + main content.
 * Sidebar is for switching docs only — editor stays the hero.
 */
export function AppShell({ documents, children }: AppShellProps) {
  return (
    <div className="flex h-svh w-full overflow-hidden bg-background">
      <DocumentSidebar documents={documents} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
