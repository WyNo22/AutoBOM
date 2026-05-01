import Link from "next/link";
import { auth } from "@/auth";
import { db, projects, projectMembers } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { createProject } from "./actions";
import { Plus } from "lucide-react";

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
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="hover:border-foreground/30 transition-colors h-full">
                <CardHeader>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  {p.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                  )}
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Créé le {formatDate(p.createdAt)}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
