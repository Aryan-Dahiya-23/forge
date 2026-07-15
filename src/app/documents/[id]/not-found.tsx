import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DocumentNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-16">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">
        Document not found
      </h1>
      <p className="max-w-xs text-center text-sm leading-relaxed text-muted-foreground">
        It may have been deleted, or the link is invalid.
      </p>
      <Link
        href="/documents"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "mt-4",
        )}
      >
        Back to documents
      </Link>
    </div>
  );
}
