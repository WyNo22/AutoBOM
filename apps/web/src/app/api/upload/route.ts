import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, attachments, bomLines } from "@/lib/db";
import { eq } from "drizzle-orm";
import { storage } from "@/lib/storage";

const ALLOWED_EXT = new Set(["dxf", "step", "stp", "stl", "3mf", "pdf", "png", "jpg", "jpeg", "webp", "other"]);
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

function detectType(filename: string): typeof attachments.$inferInsert["type"] {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ALLOWED_EXT.has(ext)) return ext as typeof attachments.$inferInsert["type"];
  return "other";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const bomLineId = formData.get("bomLineId") as string | null;

  if (!file || !bomLineId) {
    return NextResponse.json({ error: "file and bomLineId required" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 50 MB)" }, { status: 413 });
  }

  // Verify the line exists (and thus the user could have access — full RBAC in Sprint 2+)
  const [line] = await db.select({ id: bomLines.id }).from(bomLines).where(eq(bomLines.id, bomLineId)).limit(1);
  if (!line) return NextResponse.json({ error: "BOM line not found" }, { status: 404 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const { key, sizeBytes } = await storage().put(file.name, buffer);

  const [created] = await db.insert(attachments).values({
    bomLineId,
    type: detectType(file.name),
    name: file.name,
    url: key,
    sizeBytes,
  }).returning();

  return NextResponse.json({ attachment: created });
}
