import Link from "next/link";
import { db, projects, boms } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { requireProjectMember } from "@/lib/auth-helpers";
import { deleteProject, renameProject } from "../actions";
import { createBom, deleteBom, renameBom } from "./actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Plus, FileSpreadsheet, Trash2 } from "lucide-react";

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
  const renameProjectWithId = renameProject.bind(null, id);
  const deleteProjectWithId = deleteProject.bind(null, id);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        {project.description && (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Créé le {formatDate(project.createdAt)}
        </p>
        </div>
        <div className="flex flex-col gap-2 sm:w-80">
          <form action={renameProjectWithId} className="flex flex-col gap-2">
            <Input name="name" defaultValue={project.name} required />
            <Input name="description" defaultValue={project.description ?? ""} placeholder="Description" />
            <Button type="submit" variant="outline" size="sm">Renommer le projet</Button>
          </form>
          <form action={deleteProjectWithId}>
            <ConfirmSubmitButton message={`Supprimer définitivement le projet « ${project.name} » et toutes ses BOMs ?`}>
              <Trash2 className="size-3.5" />
              Supprimer le projet
            </ConfirmSubmitButton>
          </form>
        </div>
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
            <Card key={b.id} className="hover:border-foreground/30 transition-colors">
              <Link href={`/projects/${id}/boms/${b.id}`} className="block">
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
              </Link>
              <CardContent className="flex flex-col gap-2 pt-0 sm:flex-row">
                <form
                  action={async (formData) => {
                    "use server";
                    await renameBom(b.id, String(formData.get("name") ?? ""));
                  }}
                  className="flex flex-1 gap-2"
                >
                  <Input name="name" defaultValue={b.name} required />
                  <Button type="submit" variant="outline" size="sm">Renommer</Button>
                </form>
                <form action={deleteBom.bind(null, b.id)}>
                  <ConfirmSubmitButton message={`Supprimer définitivement la BOM « ${b.name} » ?`}>
                    <Trash2 className="size-3.5" />
                    Supprimer
                  </ConfirmSubmitButton>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
