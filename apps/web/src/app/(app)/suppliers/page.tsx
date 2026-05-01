import { db, suppliers } from "@/lib/db";
import { asc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUserId } from "@/lib/auth-helpers";
import { createSupplier, deleteSupplier } from "./actions";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { KNOWN_SUPPLIER_SITES } from "@autbom/shared";

export default async function SuppliersPage() {
  await requireUserId();
  const all = await db.select().from(suppliers).orderBy(asc(suppliers.name));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fournisseurs</h1>
        <p className="text-sm text-muted-foreground">
          Le catalogue partagé des fournisseurs. Reliés aux lignes BOM par la suite.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouveau fournisseur</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSupplier} className="grid sm:grid-cols-4 gap-2">
            <Input name="name" placeholder="Nom (ex. : Tolery)" required />
            <Input name="website" placeholder="https://www.tolery.fr" />
            <select
              name="knownSite"
              className="h-10 px-3 text-sm rounded-md border border-border bg-background"
              defaultValue=""
            >
              <option value="">— site connu (extension) —</option>
              {KNOWN_SUPPLIER_SITES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button type="submit">
              <Plus className="size-4" />
              Créer
            </Button>
            <Input
              name="notes"
              placeholder="Notes (conditions, contact…)"
              className="sm:col-span-4"
            />
          </form>
        </CardContent>
      </Card>

      {all.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun fournisseur.</p>
      ) : (
        <div className="border border-border rounded-md bg-card divide-y divide-border">
          {all.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 text-sm">
              <div className="flex-1">
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                  {s.website && (
                    <a
                      href={s.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="size-3" /> {new URL(s.website).hostname}
                    </a>
                  )}
                  {s.knownSite && <span className="rounded bg-muted px-1.5 py-0.5">{s.knownSite}</span>}
                  {s.notes && <span className="text-muted-foreground/80">{s.notes}</span>}
                </div>
              </div>
              <form action={deleteSupplier.bind(null, s.id)}>
                <Button type="submit" variant="ghost" size="sm">
                  <Trash2 className="size-4" />
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
