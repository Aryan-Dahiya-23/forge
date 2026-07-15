import { CreateDocumentView } from "@/components/documents/CreateDocumentView";
import { TEMPLATES } from "@/lib/templates";

export default function DocumentsCreatePage() {
  const templates = TEMPLATES.map(
    ({ id, name, description, defaultTitle, highlights }) => ({
      id,
      name,
      description,
      defaultTitle,
      highlights,
    }),
  );

  return (
    <div className="h-full overflow-y-auto">
      <CreateDocumentView templates={templates} />
    </div>
  );
}
