import { Prisma } from "@prisma/client";
import { toDocumentDTO } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { toVersionDTO } from "@/lib/versions";
import { getWorkspaceId } from "@/lib/workspace";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string; versionId: string }>;
};

/**
 * POST /api/documents/[id]/versions/[versionId]/restore
 * Restores snapshot content onto the live document.
 * Optionally snapshots the pre-restore state first (body: { snapshotCurrent?: boolean }).
 */
export async function POST(request: Request, context: RouteContext) {
  const { id: documentId, versionId } = await context.params;

  let snapshotCurrent = true;
  try {
    const body = (await request.json()) as { snapshotCurrent?: boolean };
    if (typeof body.snapshotCurrent === "boolean") {
      snapshotCurrent = body.snapshotCurrent;
    }
  } catch {
    // empty body is fine
  }

  try {
    const workspaceId = await getWorkspaceId();
    const document = await prisma.document.findUnique({
      where: { id: documentId, workspaceId },
    });
    if (!document) {
      return Response.json({ error: "Document not found." }, { status: 404 });
    }

    const version = await prisma.version.findFirst({
      where: { id: versionId, documentId },
    });
    if (!version) {
      return Response.json({ error: "Version not found." }, { status: 404 });
    }

    if (snapshotCurrent) {
      await prisma.version.create({
        data: {
          documentId,
          content: document.content as Prisma.InputJsonValue,
        },
      });
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        content: version.content as Prisma.InputJsonValue,
      },
    });

    const newerCount = await prisma.version.count({
      where: {
        documentId,
        createdAt: { gt: version.createdAt },
      },
    });

    return Response.json({
      document: toDocumentDTO(updated),
      restoredFrom: toVersionDTO(version, newerCount),
    });
  } catch (error) {
    console.error(
      `[POST /api/documents/${documentId}/versions/${versionId}/restore]`,
      error,
    );
    return Response.json(
      { error: "Failed to restore version." },
      { status: 500 },
    );
  }
}
