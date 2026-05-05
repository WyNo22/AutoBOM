import Link from "next/link";
import { db, bomLines, suppliers, users } from "@/lib/db";
import { requireBomAccess } from "@/lib/auth-helpers";
import { eq, asc } from "drizzle-orm";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BomEditor } from "./editor";
import { TourTrigger } from "@/components/tour/tour-trigger";

const BOM_TOUR = [
  { id: "bom-breadcrumb", title: "Navigation", content: "Ces liens te ramènent à ton projet ou à la liste des projets. Tu es dans le BOM Editor.", placement: "bottom" as const },
  { id: "bom-toolbar", title: "Barre d'outils", content: "Filtre les lignes, importe depuis Excel/CSV, exporte, et surveille l'état de sauvegarde automatique.", placement: "bottom" as const },
  { id: "bom-table", title: "Table BOM", content: "Chaque ligne est un composant. Clique sur une cellule pour l'éditer. Glisse les lignes pour les réordonner. Colle depuis Excel avec Ctrl+V.", placement: "top" as const },
  { id: "bom-add", title: "Ajouter une ligne", content: "Appuie sur + pour créer un nouveau composant. Tu peux aussi appuyer sur Entrée en fin de ligne.", placement: "top" as const },
];

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
      <TourTrigger steps={BOM_TOUR} storageKey="tour_bom" />

      <div data-tour="bom-breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
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
