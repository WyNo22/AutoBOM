"use server";

import { db, boms } from "@/lib/db";
import { requireProjectMember, requireBomAccess } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Create a new BOM in the given project. Redirects to the new BOM editor.
 */
export async function createBom(projectId: string, formData: FormData) {
  await requireProjectMember(projectId);
  const name = String(formData.get("name") ?? "").trim() || "Nouvelle BOM";

  const [created] = await db
    .insert(boms)
    .values({ projectId, name })
    .returning();

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}/boms/${created.id}`);
}

/**
 * Delete a BOM (cascade deletes its lines, attachments, validations, carts).
 */
export async function deleteBom(bomId: string) {
  const { project } = await requireBomAccess(bomId);
  await db.delete(boms).where(eq(boms.id, bomId));
  revalidatePath(`/projects/${project.id}`);
}

/**
 * Rename a BOM.
 */
export async function renameBom(bomId: string, name: string) {
  const { project } = await requireBomAccess(bomId);
  await db
    .update(boms)
    .set({ name: name.trim() || "BOM sans nom", updatedAt: new Date() })
    .where(eq(boms.id, bomId));
  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/projects/${project.id}/boms/${bomId}`);
}
