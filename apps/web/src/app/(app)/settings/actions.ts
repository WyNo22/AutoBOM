"use server";

import { db, users, projects, boms, attachments, bomLines } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { hashPassword, verifyPassword } from "@/lib/password";
import { storage } from "@/lib/storage";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function updateProfile(formData: FormData) {
  const userId = await requireUserId();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (!firstName || !lastName) return;
  await db
    .update(users)
    .set({ firstName, lastName, name: `${firstName} ${lastName}` })
    .where(eq(users.id, userId));
  revalidatePath("/settings");
}

export async function updatePassword(formData: FormData) {
  const userId = await requireUserId();
  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8 || password !== confirm) return;

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return;
  if (user.passwordHash && !verifyPassword(current, user.passwordHash)) return;

  await db.update(users).set({ passwordHash: hashPassword(password) }).where(eq(users.id, userId));
  revalidatePath("/settings");
}

export async function updateEmail(formData: FormData) {
  const userId = await requireUserId();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return;
  await db.update(users).set({ email, emailVerified: null }).where(eq(users.id, userId));
  revalidatePath("/settings");
}

export async function updateAvatar(imageUrl: string) {
  const userId = await requireUserId();
  await db.update(users).set({ image: imageUrl }).where(eq(users.id, userId));
  revalidatePath("/settings");
}

export async function toggleAiSourcing(enabled: boolean) {
  const userId = await requireUserId();
  await db.update(users).set({ aiSourcingEnabled: enabled }).where(eq(users.id, userId));
  revalidatePath("/settings");
}

export async function updateColumnPrefs(prefs: { order: string[]; hidden: string[] } | null) {
  const userId = await requireUserId();
  await db.update(users).set({ columnPrefs: prefs }).where(eq(users.id, userId));
}

export async function deleteAccount() {
  const userId = await requireUserId();

  const ownedProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.ownerId, userId));

  if (ownedProjects.length > 0) {
    const projectIds = ownedProjects.map((p) => p.id);
    const projectBoms = await db
      .select({ id: boms.id })
      .from(boms)
      .where(inArray(boms.projectId, projectIds));

    if (projectBoms.length > 0) {
      const bomIds = projectBoms.map((b) => b.id);
      const bomLineRows = await db
        .select({ id: bomLines.id })
        .from(bomLines)
        .where(inArray(bomLines.bomId, bomIds));

      if (bomLineRows.length > 0) {
        const lineIds = bomLineRows.map((l) => l.id);
        const atts = await db
          .select({ url: attachments.url })
          .from(attachments)
          .where(inArray(attachments.bomLineId, lineIds));

        const store = storage();
        for (const att of atts) {
          try {
            await store.delete(att.url);
          } catch {
            // best-effort: continue even if file deletion fails
          }
        }
      }
    }
  }

  await db.delete(users).where(eq(users.id, userId));

  const jar = await cookies();
  jar.delete("authjs.session-token");
  jar.delete("__Secure-authjs.session-token");
  redirect("/login");
}
