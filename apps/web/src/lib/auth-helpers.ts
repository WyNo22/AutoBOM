import "server-only";
import { auth } from "@/auth";
import { db, projectMembers, boms, projects, teamMembers } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

/**
 * Returns the current user's id, or redirects to /login.
 * Use at the top of any server component or server action that requires auth.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

/**
 * Verifies the current user is a member of the given project.
 * Returns { userId, role } or throws 404 if not a member.
 */
export async function requireProjectMember(projectId: string) {
  const userId = await requireUserId();
  const [row] = await db
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);
  if (!row) notFound();
  return { userId, role: row.role };
}

export async function requireProjectAdmin(projectId: string) {
  const membership = await requireProjectMember(projectId);
  if (membership.role !== "admin") notFound();
  return membership;
}

export async function requireProjectEditor(projectId: string) {
  const membership = await requireProjectMember(projectId);
  if (!["admin", "designer"].includes(membership.role)) notFound();
  return membership;
}

export async function requireTeamAdmin(teamId: string) {
  const userId = await requireUserId();
  const [row] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1);
  if (!row || !["owner", "admin"].includes(row.role)) notFound();
  return { userId, role: row.role };
}

/**
 * Looks up a BOM and verifies the current user has access to its project.
 * Returns { userId, role, bom, projectId } or 404.
 */
export async function requireBomAccess(bomId: string) {
  const userId = await requireUserId();
  const [row] = await db
    .select({
      bomId: boms.id,
      bomName: boms.name,
      bomStatus: boms.status,
      bomCustomColumns: boms.customColumns,
      projectId: boms.projectId,
      projectName: projects.name,
      role: projectMembers.role,
    })
    .from(boms)
    .innerJoin(projects, eq(projects.id, boms.projectId))
    .innerJoin(projectMembers, eq(projectMembers.projectId, boms.projectId))
    .where(and(eq(boms.id, bomId), eq(projectMembers.userId, userId)))
    .limit(1);
  if (!row) notFound();
  return {
    userId,
    role: row.role,
    bom: {
      id: row.bomId,
      name: row.bomName,
      status: row.bomStatus,
      customColumns: row.bomCustomColumns,
    },
    project: { id: row.projectId, name: row.projectName },
  };
}
