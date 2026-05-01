"use server";

import { db, bomLines, boms, suppliers, attachments } from "@/lib/db";
import { requireBomAccess, requireUserId } from "@/lib/auth-helpers";
import { and, eq, inArray, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { BomLineStatus } from "@autbom/shared";
import { storage } from "@/lib/storage";

// All numeric fields accept null. Empty strings → null. We accept both number
// and string from the client (because <input> values are strings) and coerce.
type LinePatch = {
  designation?: string;
  qty?: number | string | null;
  material?: string | null;
  supplierId?: string | null;
  supplierRef?: string | null;
  productUrl?: string | null;
  unitPriceHT?: number | string | null;
  tva?: number | string | null;
  leadTimeDays?: number | string | null;
  notes?: string | null;
  status?: BomLineStatus;
  position?: number;
};

function coerceNum(v: number | string | null | undefined): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function coerceStr(v: string | null | undefined): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const s = v.trim();
  return s === "" ? null : s;
}

async function bumpBomUpdated(bomId: string) {
  await db.update(boms).set({ updatedAt: new Date() }).where(eq(boms.id, bomId));
}

/**
 * Update one or more fields of a BomLine. Used on every cell edit.
 * Optimistic from the client; this just persists.
 */
export async function updateLine(
  bomId: string,
  lineId: string,
  patch: LinePatch
) {
  await requireBomAccess(bomId);

  const update: Record<string, unknown> = {};
  if (patch.designation !== undefined) update.designation = patch.designation;
  if (patch.qty !== undefined) update.qty = coerceNum(patch.qty) ?? 1;
  if (patch.material !== undefined) update.material = coerceStr(patch.material);
  if (patch.supplierId !== undefined) update.supplierId = patch.supplierId || null;
  if (patch.supplierRef !== undefined) update.supplierRef = coerceStr(patch.supplierRef);
  if (patch.productUrl !== undefined) update.productUrl = coerceStr(patch.productUrl);
  if (patch.unitPriceHT !== undefined) update.unitPriceHT = coerceNum(patch.unitPriceHT);
  if (patch.tva !== undefined) update.tva = coerceNum(patch.tva);
  if (patch.leadTimeDays !== undefined) {
    const n = coerceNum(patch.leadTimeDays);
    update.leadTimeDays = n == null ? null : Math.round(n);
  }
  if (patch.notes !== undefined) update.notes = coerceStr(patch.notes);
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.position !== undefined) update.position = patch.position;

  if (Object.keys(update).length === 0) return;

  await db
    .update(bomLines)
    .set(update)
    .where(and(eq(bomLines.id, lineId), eq(bomLines.bomId, bomId)));

  await bumpBomUpdated(bomId);
}

/**
 * Add an empty line at the end of the BOM. Returns the new line id+position.
 */
export async function addLine(bomId: string) {
  await requireBomAccess(bomId);

  const [m] = await db
    .select({ max: max(bomLines.position) })
    .from(bomLines)
    .where(eq(bomLines.bomId, bomId));
  const nextPos = (m?.max ?? 0) + 1;

  const [created] = await db
    .insert(bomLines)
    .values({
      bomId,
      position: nextPos,
      designation: "",
      qty: 1,
      status: "to_source",
    })
    .returning();

  await bumpBomUpdated(bomId);
  return created;
}

/**
 * Delete one or more lines.
 */
export async function deleteLines(bomId: string, lineIds: string[]) {
  await requireBomAccess(bomId);
  if (lineIds.length === 0) return;
  await db
    .delete(bomLines)
    .where(and(eq(bomLines.bomId, bomId), inArray(bomLines.id, lineIds)));
  await bumpBomUpdated(bomId);
}

/**
 * Bulk-paste rows from Excel (or anywhere). `rows` is an array of arrays of
 * cell values, in the same column order as the editor. Inserts new lines at
 * the end of the BOM. Returns the inserted lines so the client can update.
 *
 * Column order (must match BomEditor headers):
 *   0: designation, 1: qty, 2: material, 3: supplierRef, 4: productUrl,
 *   5: unitPriceHT, 6: tva, 7: leadTimeDays, 8: notes
 *
 * (Supplier dropdown is not pasted from Excel — users assign it in the UI.)
 */
export async function pasteLines(bomId: string, rows: string[][]) {
  await requireBomAccess(bomId);
  if (rows.length === 0) return [];

  const [m] = await db
    .select({ max: max(bomLines.position) })
    .from(bomLines)
    .where(eq(bomLines.bomId, bomId));
  let nextPos = (m?.max ?? 0) + 1;

  const values = rows.map((cells) => ({
    bomId,
    position: nextPos++,
    designation: (cells[0] ?? "").toString().trim() || "(à compléter)",
    qty: coerceNum(cells[1]) ?? 1,
    material: coerceStr(cells[2] ?? null) ?? null,
    supplierRef: coerceStr(cells[3] ?? null) ?? null,
    productUrl: coerceStr(cells[4] ?? null) ?? null,
    unitPriceHT: coerceNum(cells[5] ?? null) ?? null,
    tva: coerceNum(cells[6] ?? null) ?? null,
    leadTimeDays: (() => {
      const n = coerceNum(cells[7] ?? null);
      return n == null ? null : Math.round(n);
    })(),
    notes: coerceStr(cells[8] ?? null) ?? null,
    status: "to_source" as const,
  }));

  const inserted = await db.insert(bomLines).values(values).returning();
  await bumpBomUpdated(bomId);
  return inserted;
}

/**
 * Quick-create a supplier from the BOM editor combobox.
 */
export async function createSupplierInline(name: string) {
  await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Nom fournisseur requis");
  const [created] = await db
    .insert(suppliers)
    .values({ name: trimmed })
    .returning();
  return created;
}

/**
 * Revalidate the BOM page. Called by the client after batch operations.
 */
export async function revalidateBom(projectId: string, bomId: string) {
  revalidatePath(`/projects/${projectId}/boms/${bomId}`);
}

/**
 * Get all attachments for a single BOM line.
 */
export async function getLineAttachments(bomId: string, lineId: string) {
  await requireBomAccess(bomId);
  return db
    .select()
    .from(attachments)
    .where(eq(attachments.bomLineId, lineId));
}

/**
 * Delete an attachment (removes from storage + DB).
 */
export async function deleteAttachment(bomId: string, attachmentId: string) {
  await requireBomAccess(bomId);
  const [att] = await db
    .select()
    .from(attachments)
    .where(eq(attachments.id, attachmentId))
    .limit(1);
  if (!att) return;
  // Only delete from FS if it's not an external URL
  if (!att.url.startsWith("http")) {
    try { await storage().delete(att.url); } catch { /* already gone */ }
  }
  await db.delete(attachments).where(eq(attachments.id, attachmentId));
}
