import { NextRequest, NextResponse } from "next/server";
import { requireBomAccess } from "@/lib/auth-helpers";
import { db, bomLines, boms, suppliers } from "@/lib/db";
import { eq, max } from "drizzle-orm";

export interface CapturePayload {
  designation: string;
  supplierRef?: string;
  productUrl?: string;
  unitPriceHT?: number;
  qty?: number;
  notes?: string;
  /** Canonical supplier name detected by the content script */
  supplierName?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bomId: string }> }
) {
  let access;
  try {
    const { bomId } = await params;
    access = await requireBomAccess(bomId);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bomId } = await params;
  const body = (await req.json()) as CapturePayload;
  if (!body.designation?.trim())
    return NextResponse.json({ error: "designation required" }, { status: 400 });

  // Resolve or create supplier by name (global, no userId)
  let supplierId: string | null = null;
  if (body.supplierName?.trim()) {
    const name = body.supplierName.trim();
    const all = await db.select().from(suppliers);
    const existing = all.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      supplierId = existing.id;
    } else {
      const [created] = await db
        .insert(suppliers)
        .values({ name })
        .returning();
      supplierId = created.id;
    }
  }
  // Next position
  const [{ value: maxPos }] = await db
    .select({ value: max(bomLines.position) })
    .from(bomLines)
    .where(eq(bomLines.bomId, bomId));

  const position = (maxPos ?? 0) + 1;

  const [line] = await db
    .insert(bomLines)
    .values({
      bomId,
      position,
      designation: body.designation.trim(),
      qty: body.qty ?? 1,
      supplierRef: body.supplierRef ?? null,
      productUrl: body.productUrl ?? null,
      unitPriceHT: body.unitPriceHT ?? null,
      supplierId,
      notes: body.notes ?? null,
    })
    .returning();

  await db
    .update(boms)
    .set({ updatedAt: new Date() })
    .where(eq(boms.id, bomId));

  return NextResponse.json({ line }, { status: 201 });
}
