"use server";

import { db, suppliers } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { KnownSupplierSite } from "@autbom/shared";

export async function createSupplier(formData: FormData) {
  await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const website = String(formData.get("website") ?? "").trim() || null;
  const knownSite = String(formData.get("knownSite") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await db.insert(suppliers).values({
    name,
    website,
    knownSite: knownSite as KnownSupplierSite | null,
    notes,
  });
  revalidatePath("/suppliers");
}

export async function updateSupplier(id: string, formData: FormData) {
  await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const website = String(formData.get("website") ?? "").trim() || null;
  const knownSite = String(formData.get("knownSite") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await db
    .update(suppliers)
    .set({ name, website, knownSite: knownSite as KnownSupplierSite | null, notes })
    .where(eq(suppliers.id, id));
  revalidatePath("/suppliers");
}

export async function deleteSupplier(id: string) {
  await requireUserId();
  await db.delete(suppliers).where(eq(suppliers.id, id));
  revalidatePath("/suppliers");
}
