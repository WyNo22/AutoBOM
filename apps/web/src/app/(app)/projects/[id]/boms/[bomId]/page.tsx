import Link from "next/link";
import { db, bomLines, suppliers, users } from "@/lib/db";
import { requireBomAccess } from "@/lib/auth-helpers";
import { eq, asc } from "drizzle-orm";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BomEditor } from "./editor";

export default async function BomDetailPage({
  params,
}: {
  params: Promise<{ id: string; bomId: string }>;
}) {
  const { id: projectId, bomId } = await params;
  const { userId, bom, project } = await requireBomAccess(bomId);

  const [lines, suppliersList, user] = await Promise.all([
    db
      .select()
      .from(bomLines)
      .where(eq(bomLines.bomId, bomId))
      .orderBy(asc(bomLines.position)),
    db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers).orderBy(asc(suppliers.name)),
    db.query.users.findFirst({ where: eq(users.id, userId) }),
  ]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:text-foreground hover:underline">
          Projets
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/projects/${projectId}`} className="hover:text-foreground hover:underline flex items-center gap-1">
          <ChevronLeft className="size-4" />
          {project.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">{bom.name}</span>
      </div>

      <BomEditor
        bomId={bomId}
        projectId={projectId}
        bomName={bom.name}
        bomStatus={bom.status}
        initialLines={lines}
        initialSuppliers={suppliersList}
        initialAiSourcingEnabled={user?.aiSourcingEnabled ?? true}
        initialCustomColumns={bom.customColumns ?? []}
        initialColumnPrefs={user?.columnPrefs ?? null}
      />
    </div>
  );
}
