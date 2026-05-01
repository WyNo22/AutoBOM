import Link from "next/link";
import { db, projects, boms } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { requireProjectMember } from "@/lib/auth-helpers";
import { createBom } from "./actions";
import { Plus, FileSpreadsheet } from "lucide-react";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProjectMember(id);

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  const projectBoms = await db
    .select({
      id: boms.id,
      name: boms.name,
      status: boms.status,
      currentVersion: boms.currentVersion,
      updatedAt: boms.updatedAt,
    })
    .from(boms)
    .where(eq(boms.projectId, id))
    .orderBy(desc(boms.updatedAt));

  const createWithProjectId = createBom.bind(null, id);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        {project.description && (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Créé le {formatDate(project.createdAt)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouvelle BOM</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createWithProjectId} className="flex flex-col sm:flex-row gap-2">
            <Input
              name="name"
              placeholder="Nom de la BOM (ex. : Châssis V2)"
              className="sm:max-w-md"
            />
            <Button type="submit">
              <Plus className="size-4" />
              Créer
            </Button>
          </form>
        </CardContent>
      </Card>

      {projectBoms.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune BOM dans ce projet.</p>
      ) : (
        <div className="grid gap-3">
          {projectBoms.map((b) => (
            <Link
              key={b.id}
              href={`/projects/${id}/boms/${b.id}`}
              className="block"
            >
              <Card className="hover:border-foreground/30 transition-colors">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="size-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{b.name}</div>
                      <div className="text-xs text-muted-foreground">
                        v{b.currentVersion} · maj {formatDate(b.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground capitalize"
                  >
                    {b.status}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
