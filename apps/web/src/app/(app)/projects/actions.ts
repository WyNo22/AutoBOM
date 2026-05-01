"use server";

import { auth } from "@/auth";
import { db, projects, projectMembers } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name) return;

  const [created] = await db
    .insert(projects)
    .values({ name, description, ownerId: session.user.id })
    .returning();

  // Owner is automatically admin in their project.
  await db.insert(projectMembers).values({
    projectId: created.id,
    userId: session.user.id,
    role: "admin",
  });

  revalidatePath("/projects");
  redirect(`/projects/${created.id}`);
}
