"use server";

import { db, teamMembers, teams, users } from "@/lib/db";
import { requireTeamAdmin, requireUserId } from "@/lib/auth-helpers";
import { and, eq, like, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteTeam(teamId: string) {
  await requireTeamAdmin(teamId);
  await db.delete(teams).where(eq(teams.id, teamId));
  revalidatePath("/teams");
}

const TEAM_ROLES = ["admin", "member", "validator", "buyer", "viewer"] as const;

type TeamRole = (typeof TEAM_ROLES)[number];

function normalizeRole(value: FormDataEntryValue | null): TeamRole {
  const role = String(value ?? "member");
  return TEAM_ROLES.includes(role as TeamRole) ? (role as TeamRole) : "member";
}

export async function createTeam(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const [team] = await db.insert(teams).values({ name, ownerId: userId }).returning({ id: teams.id });
  await db.insert(teamMembers).values({ teamId: team.id, userId, role: "owner" });
  revalidatePath("/teams");
}

export async function renameTeam(teamId: string, formData: FormData) {
  await requireTeamAdmin(teamId);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await db.update(teams).set({ name }).where(eq(teams.id, teamId));
  revalidatePath("/teams");
}

export async function addTeamMember(teamId: string, formData: FormData) {
  await requireTeamAdmin(teamId);
  const query = String(formData.get("query") ?? "").trim();
  const role = normalizeRole(formData.get("role"));
  if (!query) return;

  const pattern = `%${query}%`;
  const user = await db.query.users.findFirst({
    where: or(
      eq(users.email, query.toLowerCase()),
      like(users.firstName, pattern),
      like(users.lastName, pattern),
      like(users.name, pattern)
    ),
  });
  if (!user) return;

  await db
    .insert(teamMembers)
    .values({ teamId, userId: user.id, role })
    .onConflictDoUpdate({
      target: [teamMembers.teamId, teamMembers.userId],
      set: { role },
    });
  revalidatePath("/teams");
}

export async function updateTeamMemberRole(teamId: string, userId: string, formData: FormData) {
  await requireTeamAdmin(teamId);
  const role = normalizeRole(formData.get("role"));
  await db
    .update(teamMembers)
    .set({ role })
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  revalidatePath("/teams");
}

export async function removeTeamMember(teamId: string, userId: string) {
  await requireTeamAdmin(teamId);
  await db.delete(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  revalidatePath("/teams");
}

export async function addTeamMemberById(teamId: string, userId: string, role: string) {
  await requireTeamAdmin(teamId);
  const validRoles = ["admin", "member", "validator", "buyer", "viewer"] as const;
  const safeRole = validRoles.includes(role as (typeof validRoles)[number]) ? (role as (typeof validRoles)[number]) : "member";
  await db
    .insert(teamMembers)
    .values({ teamId, userId, role: safeRole })
    .onConflictDoUpdate({
      target: [teamMembers.teamId, teamMembers.userId],
      set: { role: safeRole },
    });
  revalidatePath("/teams");
}
