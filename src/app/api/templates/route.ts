import { listTemplates } from "@/lib/templates";

export const runtime = "nodejs";

/**
 * GET /api/templates — starter document scaffolds (TipTap JSON).
 * Spec §4.4 / architecture diagram.
 */
export async function GET() {
  return Response.json({ templates: listTemplates() });
}
