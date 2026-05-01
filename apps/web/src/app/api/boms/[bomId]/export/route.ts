import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, bomLines, boms, suppliers } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import ExcelJS from "exceljs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bomId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bomId } = await params;

  const [bom] = await db.select().from(boms).where(eq(boms.id, bomId)).limit(1);
  if (!bom) return NextResponse.json({ error: "BOM not found" }, { status: 404 });

  const lines = await db
    .select()
    .from(bomLines)
    .where(eq(bomLines.bomId, bomId))
    .orderBy(asc(bomLines.position));

  const allSuppliers = await db.select().from(suppliers);
  const supplierMap = new Map(allSuppliers.map((s) => [s.id, s.name]));

  const wb = new ExcelJS.Workbook();
  wb.creator = "AUTBOM";
  const ws = wb.addWorksheet("BOM");

  ws.columns = [
    { header: "__id__", key: "id", width: 38 },
    { header: "Pos", key: "position", width: 6 },
    { header: "Désignation", key: "designation", width: 36 },
    { header: "Qté", key: "qty", width: 8 },
    { header: "Matériau", key: "material", width: 16 },
    { header: "Fournisseur", key: "supplier", width: 20 },
    { header: "Réf fournisseur", key: "supplierRef", width: 18 },
    { header: "URL produit", key: "productUrl", width: 40 },
    { header: "PU HT (€)", key: "unitPriceHT", width: 12 },
    { header: "TVA", key: "tva", width: 8 },
    { header: "Délai (j)", key: "leadTimeDays", width: 10 },
    { header: "Statut", key: "status", width: 14 },
    { header: "Notes", key: "notes", width: 40 },
  ];

  // Style header row
  ws.getRow(1).font = { bold: true };
  // Hide the __id__ column (col A) so users don't see it but re-import can use it
  ws.getColumn(1).hidden = true;

  for (const line of lines) {
    ws.addRow({
      id: line.id,
      position: line.position,
      designation: line.designation,
      qty: line.qty,
      material: line.material ?? "",
      supplier: line.supplierId ? (supplierMap.get(line.supplierId) ?? "") : "",
      supplierRef: line.supplierRef ?? "",
      productUrl: line.productUrl ?? "",
      unitPriceHT: line.unitPriceHT ?? "",
      tva: line.tva ?? "",
      leadTimeDays: line.leadTimeDays ?? "",
      status: line.status,
      notes: line.notes ?? "",
    });
  }

  // Totals row
  const totalHT = lines.reduce((s, l) => s + (l.unitPriceHT ?? 0) * l.qty, 0);
  const totalTTC = lines.reduce(
    (s, l) => s + (l.unitPriceHT ?? 0) * l.qty * (1 + (l.tva ?? 0)),
    0
  );
  const totRow = ws.addRow({
    designation: "TOTAL",
    unitPriceHT: totalHT,
    notes: `TTC: ${totalTTC.toFixed(2)} €`,
  });
  totRow.font = { bold: true };

  const buf = await wb.xlsx.writeBuffer();
  const safeName = bom.name.replace(/[^a-zA-Z0-9_-]/g, "_");

  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="BOM_${safeName}.xlsx"`,
    },
  });
}
