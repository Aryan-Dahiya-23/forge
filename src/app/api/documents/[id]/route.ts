import { Prisma } from "@prisma/client";
import { isJsonContent, toDocumentDTO } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { getWorkspaceId } from "@/lib/workspace";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/documents/[id] */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const workspaceId = await getWorkspaceId();
    const document = await prisma.document.findUnique({
      where: { id, workspaceId },
    });
    if (!document) {
      return Response.json({ error: "Document not found." }, { status: 404 });
    }
    return Response.json({ document: toDocumentDTO(document) });
  } catch (error) {
    console.error(`[GET /api/documents/${id}]`, error);
    return Response.json(
      { error: "Failed to fetch document." },
      { status: 500 },
    );
  }
}

/** PUT /api/documents/[id] — update title and/or content (autosave target) */
export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const record =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  const data: Prisma.DocumentUpdateInput = {};

  if (typeof record.title === "string") {
    const title = record.title.trim();
    if (!title) {
      return Response.json({ error: "Title cannot be empty." }, { status: 400 });
    }
    data.title = title;
  }

  if ("content" in record) {
    if (!isJsonContent(record.content)) {
      return Response.json(
        { error: "content must be a TipTap document JSON object." },
        { status: 400 },
      );
    }
    data.content = record.content as Prisma.InputJsonValue;
  }

  if (Object.keys(data).length === 0) {
    return Response.json(
      { error: "Provide title and/or content to update." },
      { status: 400 },
    );
  }

  try {
    const workspaceId = await getWorkspaceId();
    const document = await prisma.document.update({
      where: { id, workspaceId },
      data,
    });
    return Response.json({ document: toDocumentDTO(document) });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return Response.json({ error: "Document not found." }, { status: 404 });
    }
    console.error(`[PUT /api/documents/${id}]`, error);
    return Response.json(
      { error: "Failed to update document." },
      { status: 500 },
    );
  }
}

/** DELETE /api/documents/[id] — optional convenience for the document list */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const workspaceId = await getWorkspaceId();
    await prisma.document.delete({ where: { id, workspaceId } });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return Response.json({ error: "Document not found." }, { status: 404 });
    }
    console.error(`[DELETE /api/documents/${id}]`, error);
    return Response.json(
      { error: "Failed to delete document." },
      { status: 500 },
    );
  }
}
