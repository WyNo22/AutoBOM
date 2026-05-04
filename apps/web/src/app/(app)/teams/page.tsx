import { db, teamMembers, teams, users } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { createTeam, addTeamMember, removeTeamMember, renameTeam, updateTeamMemberRole } from "./actions";
import { Plus, Trash2, Users } from "lucide-react";

const TEAM_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Membre" },
  { value: "validator", label: "Validateur" },
  { value: "buyer", label: "Acheteur" },
  { value: "viewer", label: "Lecteur" },
];

export default async function TeamsPage() {
  const userId = await requireUserId();
  const rows = await db
    .select({
      teamId: teams.id,
      teamName: teams.name,
      teamOwnerId: teams.ownerId,
      teamCreatedAt: teams.createdAt,
      currentRole: teamMembers.role,
    })
    .from(teams)
    .innerJoin(teamMembers, eq(teamMembers.teamId, teams.id))
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
            <Input name="name" placeholder="Nom de l'équipe" required className="sm:max-w-xs" />
            <Button type="submit">
              <Plus className="size-4" />
              Créer
            </Button>
          </form>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune équipe pour l’instant.</p>
      ) : (
        <div className="grid gap-4">
          {rows.map((team) => {
            const teamMembersList = members.filter((member) => member.teamId === team.teamId);
            const canAdmin = ["owner", "admin"].includes(team.currentRole);
            return (
              <Card key={team.teamId}>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="size-4 text-muted-foreground" />
                      {team.teamName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Ton rôle : {team.currentRole}</p>
                  </div>
                  {canAdmin && (
                    <form action={renameTeam.bind(null, team.teamId)} className="flex gap-2 sm:w-80">
                      <Input name="name" defaultValue={team.teamName} required />
                      <Button type="submit" variant="outline" size="sm">Renommer</Button>
                    </form>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {canAdmin && (
                    <form action={addTeamMember.bind(null, team.teamId)} className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
                      <Input name="query" placeholder="Email, prénom ou nom" required />
                      <select name="role" defaultValue="member" className="h-8 rounded-md border border-border bg-background px-2 text-sm">
                        {TEAM_ROLE_OPTIONS.map((role) => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                      <Button type="submit" size="sm">Ajouter</Button>
                    </form>
                  )}
                  <div className="divide-y rounded-md border border-border">
                    {teamMembersList.map((member) => (
                      <div key={member.userId} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-medium">{member.name || `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || member.email}</div>
                          <div className="text-xs text-muted-foreground">{member.email} · {member.role}</div>
                        </div>
                        {canAdmin && member.role !== "owner" && (
                          <div className="flex gap-2">
                            <form action={updateTeamMemberRole.bind(null, team.teamId, member.userId)} className="flex gap-2">
                              <select name="role" defaultValue={member.role} className="h-8 rounded-md border border-border bg-background px-2 text-sm">
                                {TEAM_ROLE_OPTIONS.map((role) => (
                                  <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                              </select>
                              <Button type="submit" variant="outline" size="sm">OK</Button>
                            </form>
                            <form action={removeTeamMember.bind(null, team.teamId, member.userId)}>
                              <ConfirmSubmitButton message={`Retirer ${member.email} de l'équipe ?`}>
                                <Trash2 className="size-3.5" />
                              </ConfirmSubmitButton>
                            </form>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
