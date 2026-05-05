import { auth } from "@/auth";
import { db, projectMembers, projects, teamInvites, teamMembers } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";

function toProjectRole(role: string): "designer" | "validator" | "buyer_small" | "buyer_big" | "admin" {
  if (role === "admin") return "admin";
  if (role === "validator") return "validator";
  if (role === "buyer") return "buyer_small";
  return "designer";
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/register?invite=${encodeURIComponent(token)}`);
  }

  const [invite] = await db
    .select()
    .from(teamInvites)
    .where(and(eq(teamInvites.token, token), isNull(teamInvites.acceptedAt)))
    .limit(1);

  if (!invite || invite.expiresAt < new Date()) {
    redirect("/projects?invite=expired");
  }

  const userId = session.user.id;
  await db
    .insert(teamMembers)
    .values({ teamId: invite.teamId, userId, role: invite.role })
    .onConflictDoUpdate({
      target: [teamMembers.teamId, teamMembers.userId],
      set: { role: invite.role },
    });

  const [project] = await db.select({ id: projects.id }).from(projects).where(eq(projects.teamId, invite.teamId)).limit(1);
  if (project) {
    await db
      .insert(projectMembers)
      .values({ projectId: project.id, userId, role: toProjectRole(invite.role) })
      .onConflictDoUpdate({
        target: [projectMembers.projectId, projectMembers.userId],
        set: { role: toProjectRole(invite.role) },
      });
  }

  await db.update(teamInvites).set({ acceptedAt: new Date() }).where(eq(teamInvites.id, invite.id));
  redirect(project ? `/projects/${project.id}` : "/teams");
}
