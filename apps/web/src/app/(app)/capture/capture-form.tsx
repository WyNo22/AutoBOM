"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Loader2 } from "lucide-react";

type Product = {
  designation: string;
  supplierName: string;
  supplierRef?: string;
  productUrl: string;
  unitPriceHT?: number;
};

type BomOption = {
  bomId: string;
  bomName: string;
  bomStatus: string;
  projectId: string;
  projectName: string;
};

const LAST_BOM_KEY = "autobom_last_capture_bom";

export function CaptureForm({ product, boms }: { product: Product; boms: BomOption[] }) {
  const router = useRouter();
  const [bomId, setBomId] = React.useState<string>("");
  const [qty, setQty] = React.useState<number>(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState<{ projectId: string; bomId: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Pre-select last used BOM (if still available)
  React.useEffect(() => {
    const last = localStorage.getItem(LAST_BOM_KEY);
    if (last && boms.some((b) => b.bomId === last)) {
      setBomId(last);
    } else if (boms.length > 0) {
      setBomId(boms[0].bomId);
    }
  }, [boms]);

  // Group BOMs by project for display
  const grouped = React.useMemo(() => {
    const map = new Map<string, { name: string; items: BomOption[] }>();
    for (const b of boms) {
      if (!map.has(b.projectId)) map.set(b.projectId, { name: b.projectName, items: [] });
      map.get(b.projectId)!.items.push(b);
    }
    return Array.from(map.values());
  }, [boms]);

  async function handleSubmit() {
    if (!bomId) {
      setError("Sélectionne une BOM.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/boms/${bomId}/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designation: product.designation,
          supplierRef: product.supplierRef,
          productUrl: product.productUrl,
          unitPriceHT: product.unitPriceHT,
          qty,
          supplierName: product.supplierName,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Erreur lors de l'ajout");
      }
      localStorage.setItem(LAST_BOM_KEY, bomId);
      const target = boms.find((b) => b.bomId === bomId)!;
      setDone({ projectId: target.projectId, bomId: target.bomId });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setError(msg);
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-6 text-center space-y-4">
        <div
          className="size-12 mx-auto rounded-full flex items-center justify-center"
          style={{ background: "rgba(52,211,153,0.2)" }}
        >
          <Check className="size-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Ajouté à la BOM</h2>
          <p className="text-sm text-muted-foreground mt-1">
            « {product.designation} » a été ajouté avec succès.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <button
            onClick={() => router.push(`/projects/${done.projectId}/boms/${done.bomId}`)}
            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            Ouvrir la BOM
          </button>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 rounded-md border border-white/10 hover:bg-white/5 text-sm transition-colors"
          >
            Fermer cet onglet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Product preview */}
      <div className="rounded-lg border border-white/10 bg-white/4 p-4 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Produit
        </div>
        <div className="text-sm font-medium text-foreground leading-snug">
          {product.designation}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{product.supplierName}</span>
          {product.supplierRef && <span>· Réf : {product.supplierRef}</span>}
          {product.unitPriceHT && (
            <span className="text-indigo-400">
              · {product.unitPriceHT.toFixed(2)} € HT
            </span>
          )}
        </div>
        {product.productUrl && (
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-indigo-400 transition-colors"
          >
            Voir la fiche d&apos;origine <ExternalLink className="size-3" />
          </a>
        )}
      </div>

      {/* BOM select */}
      <div className="space-y-2">
        <label htmlFor="bom-select" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
          BOM de destination
        </label>
        <select
          id="bom-select"
          value={bomId}
          onChange={(e) => setBomId(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-white/10 bg-white/5 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
          {grouped.map((proj) => (
            <optgroup key={proj.name} label={proj.name}>
              {proj.items.map((b) => (
                <option key={b.bomId} value={b.bomId}>
                  {b.bomName} ({b.bomStatus})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Quantity */}
      <div className="space-y-2">
        <label htmlFor="qty" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
          Quantité
        </label>
        <input
          id="qty"
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-32 px-3 py-2 rounded-md border border-white/10 bg-white/5 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-950/20 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSubmit}
          disabled={submitting || !bomId}
          className="flex-1 px-4 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Ajout en cours…
            </>
          ) : (
            "Ajouter à la BOM"
          )}
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2.5 rounded-md border border-white/10 hover:bg-white/5 text-sm transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
