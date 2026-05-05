import { auth } from "@/auth";
import { db, projects, projectMembers } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProject } from "./actions";
import { ProjectCard } from "./project-card";
import { Plus } from "lucide-react";
import { TourTrigger } from "@/components/tour/tour-trigger";

const PROJECTS_TOUR = [
  { id: "projects-title", title: "Tes projets", content: "Un projet regroupe toutes tes BOMs (nomenclatures). Crée un projet par produit ou chantier.", placement: "bottom" as const },
  { id: "projects-create", title: "Créer un projet", content: "Donne un nom et une description optionnelle. Un projet lié à une équipe sera automatiquement partagé avec ses membres.", placement: "bottom" as const },
  { id: "projects-grid", title: "Tes projets", content: "Clique sur une carte pour accéder au projet, voir ses BOMs et les gérer.", placement: "top" as const },
];

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
      <TourTrigger steps={PROJECTS_TOUR} storageKey="tour_projects" userId={userId} />

      <div className="flex items-end justify-between">
        <div data-tour="projects-title">
          <h1 className="text-2xl font-semibold tracking-tight">Projets</h1>
          <p className="text-sm text-muted-foreground">
            Crée un projet pour démarrer une BOM.
          </p>
        </div>
      </div>

      <Card data-tour="projects-create">
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
        <div data-tour="projects-grid" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
