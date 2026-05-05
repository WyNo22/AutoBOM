import { db, projects, boms } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import React from "react";
import { requireProjectMember } from "@/lib/auth-helpers";
import { createBom } from "./actions";
import { BomCard } from "./bom-card";
import { ProjectActions } from "./project-actions";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

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
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:text-foreground hover:underline">
          Projets
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">{project.name}</span>
      </div>

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
        <ProjectActions project={{ id: project.id, name: project.name, description: project.description }} />
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
            <BomCard key={b.id} bom={b} projectId={id} />
          ))}
        </div>
      )}
    </div>
  );
}
