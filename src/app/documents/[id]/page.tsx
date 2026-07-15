import { notFound } from "next/navigation";
import { Editor } from "@/components/editor/Editor";
import { toDocumentDTO } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { getWorkspaceId } from "@/lib/workspace";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentPage({ params }: PageProps) {
  const { id } = await params;
  const workspaceId = await getWorkspaceId();

  const row = await prisma.document.findUnique({ where: { id, workspaceId } });
  if (!row) {
    notFound();
  }

  const document = toDocumentDTO(row);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <Editor
        key={document.id}
        documentId={document.id}
        initialTitle={document.title}
        initialContent={document.content}
      />
    </div>
  );
}
