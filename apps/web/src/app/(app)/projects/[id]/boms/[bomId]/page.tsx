import Link from "next/link";
import { db, bomLines, suppliers } from "@/lib/db";
import { requireBomAccess } from "@/lib/auth-helpers";
import { eq, asc } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { BomEditor } from "./editor";

export default async function BomDetailPage({
  params,
}: {
  params: Promise<{ id: string; bomId: string }>;
}) {
  const { id: projectId, bomId } = await params;
  const { bom, project } = await requireBomAccess(bomId);

  const [lines, suppliersList] = await Promise.all([
    db
      .select()
      .from(bomLines)
      .where(eq(bomLines.bomId, bomId))
      .orderBy(asc(bomLines.position)),
    db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers).orderBy(asc(suppliers.name)),
  ]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/projects/${projectId}`} className="hover:underline flex items-center gap-1">
          <ChevronLeft className="size-4" />
          {project.name}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{bom.name}</span>
      </div>

      <BomEditor
        bomId={bomId}
        projectId={projectId}
        bomName={bom.name}
        bomStatus={bom.status}
        initialLines={lines}
        initialSuppliers={suppliersList}
      />
    </div>
  );
}
