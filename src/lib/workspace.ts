import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const WORKSPACE_COOKIE_NAME = "docforge-workspace-id";

/**
 * Retrieves the current workspace ID from the request cookies.
 * The middleware guarantees this cookie is set for every request.
 */
export async function getWorkspaceId(): Promise<string> {
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get(WORKSPACE_COOKIE_NAME)?.value;

  if (!workspaceId) {
    throw new Error("Workspace ID not found. Ensure middleware is running.");
  }

  return workspaceId;
}

/**
 * Initializes the workspace if it doesn't exist.
 * This ensures the Workspace record is created in the database and seeds starter documents
 * so the user's first experience isn't an empty screen.
 */
export async function initializeWorkspace(workspaceId: string): Promise<void> {
  const existing = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (existing) {
    return; // Already initialized
  }

  await prisma.$transaction(async (tx) => {
    // Attempt to find inside transaction again in case of race conditions
    const check = await tx.workspace.findUnique({ where: { id: workspaceId } });
    if (check) return;

    await tx.workspace.create({
      data: { id: workspaceId },
    });
  });
}
