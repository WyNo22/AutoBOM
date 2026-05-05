import { db, projects, teamMembers, teams, users } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTeam } from "./actions";
import { TeamCard } from "./team-card";
import { Plus } from "lucide-react";

export default async function TeamsPage() {
  const userId = await requireUserId();
  const rows = await db
    .select({
      teamId: teams.id,
      teamName: teams.name,
      teamOwnerId: teams.ownerId,
      teamCreatedAt: teams.createdAt,
      currentRole: teamMembers.role,
      projectId: projects.id,
      projectName: projects.name,
    })
    .from(teams)
    .innerJoin(teamMembers, eq(teamMembers.teamId, teams.id))
    .leftJoin(projects, eq(projects.teamId, teams.id))
    .where(eq(teamMembers.userId, userId))
    .orderBy(desc(teams.createdAt));

  const teamIds = rows.map((row) => row.teamId);
  const members = teamIds.length
    ? await db
        .select({
          teamId: teamMembers.teamId,
          userId: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: teamMembers.role,
        })
        .from(teamMembers)
        .innerJoin(users, eq(users.id, teamMembers.userId))
    : [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Équipes</h1>
        <p className="text-sm text-muted-foreground">Crée des équipes, ajoute des membres et attribue leurs rôles.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouvelle équipe</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTeam} className="flex flex-col sm:flex-row gap-2">
            <Input name="name" placeholder="Nom de l&apos;équipe" required className="sm:max-w-xs" />
            <Input name="projectName" placeholder="Projet lié (optionnel)" className="sm:max-w-xs" />
            <Button type="submit">
              <Plus className="size-4" />
              Créer
            </Button>
          </form>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune équipe pour l&apos;instant.</p>
      ) : (
        <div className="grid gap-4">
          {rows.map((team) => {
            const teamMembersList = members.filter((m) => m.teamId === team.teamId);
            return (
              <TeamCard
                key={team.teamId}
                team={team}
                members={teamMembersList}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
