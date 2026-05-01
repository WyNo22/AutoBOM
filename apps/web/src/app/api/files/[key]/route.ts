import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fsPathOf } from "@/lib/storage";
import { promises as fs } from "node:fs";
import path from "node:path";
const MIME: Record<string, string> = {
  dxf: "application/dxf",
  step: "application/step",
  stp: "application/step",
  stl: "model/stl",
  "3mf": "model/3mf",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

function mimeOf(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME[ext] ?? "application/octet-stream";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key } = await params;

  // Prevent path traversal
  const decodedKey = decodeURIComponent(key);
  if (decodedKey.includes("..") || path.isAbsolute(decodedKey)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const filePath = fsPathOf(decodedKey);
  try {
    const buf = await fs.readFile(filePath);
    const mimeType = mimeOf(decodedKey);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(decodedKey.split("-").slice(5).join("-") || decodedKey)}"`,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
