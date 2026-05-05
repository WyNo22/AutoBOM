import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db, boms, projects, projectMembers } from "@/lib/db";
import { eq } from "drizzle-orm";
import { CaptureForm } from "./capture-form";
import { Package } from "lucide-react";

type Product = {
  designation: string;
  supplierName: string;
  supplierRef?: string;
  productUrl: string;
  unitPriceHT?: number;
};

function decodeProduct(p: string | undefined): Product | null {
  if (!p) return null;
  try {
    const b64 = p.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = decodeURIComponent(escape(atob(padded)));
    const parsed = JSON.parse(json) as Product;
    if (!parsed?.designation) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default async function CapturePage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    const sp = await searchParams;
    redirect(`/login?from=${encodeURIComponent(`/capture?p=${sp.p ?? ""}`)}`);
  }

  const { p } = await searchParams;
  const product = decodeProduct(p);

  const userId = session.user.id;
  const bomList = await db
    .select({
      bomId: boms.id,
      bomName: boms.name,
      bomStatus: boms.status,
      projectId: projects.id,
      projectName: projects.name,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projects.id, projectMembers.projectId))
    .innerJoin(boms, eq(boms.projectId, projects.id))
    .where(eq(projectMembers.userId, userId))
    .orderBy(projects.name, boms.name);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="size-10 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}
        >
          <Package className="size-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Capture produit</h1>
          <p className="text-sm text-muted-foreground">
            Choisis la BOM dans laquelle ajouter ce produit.
          </p>
        </div>
      </div>

      {!product ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-6 text-sm text-amber-300">
          <p className="font-medium mb-2">Aucun produit reçu</p>
          <p className="text-amber-300/80 leading-relaxed">
            Cette page est destinée à recevoir un produit capturé depuis l&apos;extension Chrome
            AutoBOM. Pour l&apos;utiliser, installe l&apos;extension, navigue sur une fiche
            produit (Amazon, AliExpress, Tolery, etc.), puis clique sur l&apos;icône AutoBOM.
          </p>
          <Link
            href="/projects"
            className="inline-block mt-4 text-amber-300 hover:text-amber-200 underline"
          >
            ← Retour aux projets
          </Link>
        </div>
      ) : bomList.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/4 p-6 text-sm">
          <p className="font-medium text-foreground mb-2">Aucune BOM disponible</p>
          <p className="text-muted-foreground leading-relaxed">
            Tu n&apos;as encore aucune BOM. Crée un projet et une BOM, puis reviens ici.
          </p>
          <Link
            href="/projects"
            className="inline-block mt-4 text-indigo-400 hover:text-indigo-300 underline"
          >
            Créer un projet →
          </Link>
        </div>
      ) : (
        <CaptureForm product={product} boms={bomList} />
      )}
    </div>
  );
}
