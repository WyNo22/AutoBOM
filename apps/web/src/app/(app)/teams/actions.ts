"use server";

import { db, projectMembers, projects, teamInvites, teamMembers, teams, users } from "@/lib/db";
import { requireTeamAdmin, requireUserId } from "@/lib/auth-helpers";
import { and, eq, like, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";

export async function deleteTeam(teamId: string) {
  await requireTeamAdmin(teamId);
  await db.delete(teams).where(eq(teams.id, teamId));
  revalidatePath("/teams");
}

const TEAM_ROLES = ["admin", "member", "validator", "buyer", "viewer"] as const;

type TeamRole = (typeof TEAM_ROLES)[number];
type ProjectRole = "designer" | "validator" | "buyer_small" | "buyer_big" | "admin";

function normalizeRole(value: FormDataEntryValue | null): TeamRole {
  const role = String(value ?? "member");
  return TEAM_ROLES.includes(role as TeamRole) ? (role as TeamRole) : "member";
}

function toProjectRole(role: TeamRole | "owner"): ProjectRole {
  if (role === "admin" || role === "owner") return "admin";
  if (role === "validator") return "validator";
  if (role === "buyer") return "buyer_small";
  return "designer";
}

async function linkedProjectId(teamId: string): Promise<string | null> {
  const [project] = await db.select({ id: projects.id }).from(projects).where(eq(projects.teamId, teamId)).limit(1);
  return project?.id ?? null;
}

async function upsertProjectMemberForTeam(teamId: string, userId: string, role: TeamRole | "owner") {
  const projectId = await linkedProjectId(teamId);
  if (!projectId) return;
  await db
    .insert(projectMembers)
    .values({ projectId, userId, role: toProjectRole(role) })
    .onConflictDoUpdate({
      target: [projectMembers.projectId, projectMembers.userId],
      set: { role: toProjectRole(role) },
    });
}

export async function createTeam(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const projectName = String(formData.get("projectName") ?? "").trim() || name;
  if (!name) return;
  const [team] = await db.insert(teams).values({ name, ownerId: userId }).returning({ id: teams.id });
  await db.insert(teamMembers).values({ teamId: team.id, userId, role: "owner" });
  const [project] = await db
    .insert(projects)
    .values({ name: projectName, description: `Projet lié à l’équipe ${name}`, teamId: team.id, ownerId: userId })
    .returning({ id: projects.id });
  await db.insert(projectMembers).values({ projectId: project.id, userId, role: "admin" });
  revalidatePath("/teams");
  revalidatePath("/projects");
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
  await upsertProjectMemberForTeam(teamId, user.id, role);
  revalidatePath("/teams");
  revalidatePath("/projects");
}

export async function updateTeamMemberRole(teamId: string, userId: string, formData: FormData) {
  await requireTeamAdmin(teamId);
  const role = normalizeRole(formData.get("role"));
  await db
    .update(teamMembers)
    .set({ role })
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  await upsertProjectMemberForTeam(teamId, userId, role);
  revalidatePath("/teams");
  revalidatePath("/projects");
}

export async function removeTeamMember(teamId: string, userId: string) {
  await requireTeamAdmin(teamId);
  await db.delete(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  const projectId = await linkedProjectId(teamId);
  if (projectId) await db.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
  revalidatePath("/teams");
  revalidatePath("/projects");
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
  await upsertProjectMemberForTeam(teamId, userId, safeRole);
  revalidatePath("/teams");
  revalidatePath("/projects");
}

export async function createTeamInvite(teamId: string, role: string, email?: string) {
  await requireTeamAdmin(teamId);
  const safeRole = TEAM_ROLES.includes(role as TeamRole) ? (role as TeamRole) : "member";
  const token = randomBytes(24).toString("hex");
  await db.insert(teamInvites).values({
    teamId,
    email: (email ?? "").trim().toLowerCase(),
    role: safeRole,
    token,
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });
  return `/invite/${token}`;
}
