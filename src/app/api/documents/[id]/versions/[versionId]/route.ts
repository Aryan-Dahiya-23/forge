import { prisma } from "@/lib/prisma";
import { toVersionDTO } from "@/lib/versions";
import { getWorkspaceId } from "@/lib/workspace";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string; versionId: string }>;
};

/** GET /api/documents/[id]/versions/[versionId] — full snapshot for viewing */
export async function GET(_request: Request, context: RouteContext) {
  const { id: documentId, versionId } = await context.params;

  try {
    const workspaceId = await getWorkspaceId();
    // Verify document belongs to workspace
    const doc = await prisma.document.findUnique({
      where: { id: documentId, workspaceId },
      select: { id: true },
    });
    if (!doc) {
      return Response.json({ error: "Document not found." }, { status: 404 });
    }

    const version = await prisma.version.findUnique({
      where: { id: versionId, documentId },
    });
    if (!version) {
      return Response.json({ error: "Version not found." }, { status: 404 });
    }

    // Rank among siblings for a stable "Snapshot N" label (newest = 1)
    const newerCount = await prisma.version.count({
      where: {
        documentId,
        createdAt: { gt: version.createdAt },
      },
    });

    return Response.json({
      version: toVersionDTO(version, newerCount),
    });
  } catch (error) {
    console.error(
      `[GET /api/documents/${documentId}/versions/${versionId}]`,
      error,
    );
    return Response.json(
      { error: "Failed to fetch version." },
      { status: 500 },
    );
  }
}
