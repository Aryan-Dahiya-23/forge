import { Prisma } from "@prisma/client";
import {
  defaultNewDocumentContent,
  isJsonContent,
  toDocumentDTO,
  toListItem,
} from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { getTemplate, isTemplateId } from "@/lib/templates";
import { getWorkspaceId } from "@/lib/workspace";

export const runtime = "nodejs";

/** GET /api/documents — list documents (newest first) */
export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const documents = await prisma.document.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json({ documents: documents.map(toListItem) });
  } catch (error) {
    console.error("[GET /api/documents]", error);
    return Response.json(
      { error: "Failed to list documents." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/documents — create a document.
 * Body: { title?, content?, templateId? }
 * templateId wins for content (and default title) unless title/content are explicit.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const record =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  const template =
    isTemplateId(record.templateId) ? getTemplate(record.templateId) : undefined;

  if (record.templateId !== undefined && !template) {
    return Response.json(
      { error: "Unknown templateId." },
      { status: 400 },
    );
  }

  const title =
    typeof record.title === "string" && record.title.trim()
      ? record.title.trim()
      : (template?.defaultTitle ?? "Untitled document");

  const content = isJsonContent(record.content)
    ? record.content
    : template
      ? structuredClone(template.content)
      : defaultNewDocumentContent();

  try {
    const workspaceId = await getWorkspaceId();

    const document = await prisma.document.create({
      data: {
        workspaceId,
        title,
        content: content as Prisma.InputJsonValue,
      },
    });

    return Response.json(
      { document: toDocumentDTO(document) },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/documents]", error);
    return Response.json(
      { error: "Failed to create document." },
      { status: 500 },
    );
  }
}
