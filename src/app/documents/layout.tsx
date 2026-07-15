import { AppShell } from "@/components/layout/AppShell";
import { toListItem } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { getWorkspaceId, initializeWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let documents: ReturnType<typeof toListItem>[] = [];

  try {
    const workspaceId = await getWorkspaceId();
    await initializeWorkspace(workspaceId);

    const rows = await prisma.document.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    documents = rows.map(toListItem);
  } catch (error) {
    console.error("[documents/layout] list documents", error);
  }

  return <AppShell documents={documents}>{children}</AppShell>;
}
