import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  wide?: boolean;
  actions?: React.ReactNode;
};

export function AppHeader({
  subtitle,
  backHref,
  backLabel = "Documents",
  wide = false,
  actions,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/70">
      <div
        className={cn(
          "mx-auto flex h-12 items-center justify-between gap-3 px-4 sm:px-6",
          wide ? "max-w-3xl" : "max-w-xl",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {backHref ? (
            <Link
              href={backHref}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "-ml-2 shrink-0 text-muted-foreground transition-colors hover:text-foreground",
              )}
            >
              <ArrowLeft data-icon="inline-start" strokeWidth={1.75} />
              <span className="hidden sm:inline">{backLabel}</span>
            </Link>
          ) : (
            <Link
              href="/"
              className={cn(
                "truncate rounded-sm text-sm font-semibold tracking-tight text-foreground",
                "transition-opacity hover:opacity-80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2",
              )}
            >
              DocForge
            </Link>
          )}
          {subtitle && !backHref ? (
            <span className="truncate text-sm text-muted-foreground">
              {subtitle}
            </span>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
