import Link from "next/link";
import { auth } from "@/auth";
import { db, projects, projectMembers } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { createProject, deleteProject, renameProject } from "./actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Plus, Trash2 } from "lucide-react";

export default async function ProjectsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  // Projects where user is a member (owner or invited).
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .innerJoin(projectMembers, eq(projectMembers.projectId, projects.id))
    .where(eq(projectMembers.userId, userId))
    .orderBy(desc(projects.createdAt));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projets</h1>
          <p className="text-sm text-muted-foreground">
            Crée un projet pour démarrer une BOM.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouveau projet</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProject} className="flex flex-col sm:flex-row gap-2">
            <Input name="name" placeholder="Nom du projet" required className="sm:max-w-xs" />
            <Input name="description" placeholder="Description (optionnelle)" className="flex-1" />
            <Button type="submit">
              <Plus className="size-4" />
              Créer
            </Button>
          </form>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun projet pour l&apos;instant.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <Card key={p.id} className="hover:border-foreground/30 transition-colors h-full">
              <Link href={`/projects/${p.id}`} className="block">
                <CardHeader>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  {p.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                  )}
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Créé le {formatDate(p.createdAt)}
                </CardContent>
              </Link>
              <CardContent className="flex flex-col gap-2 pt-0">
                <form action={renameProject.bind(null, p.id)} className="flex flex-col gap-2">
                  <Input name="name" defaultValue={p.name} required />
                  <Input name="description" defaultValue={p.description ?? ""} placeholder="Description" />
                  <Button type="submit" variant="outline" size="sm">Renommer</Button>
                </form>
                <form action={deleteProject.bind(null, p.id)}>
                  <ConfirmSubmitButton message={`Supprimer définitivement le projet « ${p.name} » et toutes ses BOMs ?`}>
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
