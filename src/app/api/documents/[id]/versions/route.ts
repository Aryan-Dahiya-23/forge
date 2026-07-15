import { Prisma } from "@prisma/client";
import { isJsonContent, toDocumentDTO } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { toVersionDTO, toVersionListItem } from "@/lib/versions";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/documents/[id]/versions — list snapshots (newest first) */
export async function GET(_request: Request, context: RouteContext) {
  const { id: documentId } = await context.params;

  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true },
    });
    if (!document) {
      return Response.json({ error: "Document not found." }, { status: 404 });
    }

    const versions = await prisma.version.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({
      versions: versions.map((version, index) =>
        toVersionListItem(version, index),
      ),
    });
  } catch (error) {
    console.error(`[GET /api/documents/${documentId}/versions]`, error);
    return Response.json(
      { error: "Failed to list versions." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/documents/[id]/versions — snapshot current state.
 * Body optional: { content? } — if omitted, uses content stored on the document.
 * When content is provided, the live document is updated first so the snapshot matches the editor.
 */
export async function POST(request: Request, context: RouteContext) {
  const { id: documentId } = await context.params;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const record =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  try {
    const existing = await prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!existing) {
      return Response.json({ error: "Document not found." }, { status: 404 });
    }

    let contentJson: Prisma.InputJsonValue = existing.content as Prisma.InputJsonValue;

    if ("content" in record) {
      if (!isJsonContent(record.content)) {
        return Response.json(
          { error: "content must be a TipTap document JSON object." },
          { status: 400 },
        );
      }
      contentJson = record.content as Prisma.InputJsonValue;

      // Keep live doc in sync with what was snapshotted from the editor.
      await prisma.document.update({
        where: { id: documentId },
        data: { content: contentJson },
      });
    }

    const version = await prisma.version.create({
      data: {
        documentId,
        content: contentJson,
      },
    });

    const document = await prisma.document.findUniqueOrThrow({
      where: { id: documentId },
    });

    return Response.json(
      {
        version: toVersionDTO(version, 0),
        document: toDocumentDTO(document),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(`[POST /api/documents/${documentId}/versions]`, error);
    return Response.json(
      { error: "Failed to create snapshot." },
      { status: 500 },
    );
  }
}
