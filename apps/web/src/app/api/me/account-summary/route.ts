import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, projects, boms, teams, bomLines, attachments } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const ownedProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.ownerId, userId));

  const ownedTeams = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.ownerId, userId));

  let ownedBoms = 0;
  let attachmentCount = 0;

  if (ownedProjects.length > 0) {
    const projectIds = ownedProjects.map((p) => p.id);
    const projectBoms = await db
      .select({ id: boms.id })
      .from(boms)
      .where(inArray(boms.projectId, projectIds));

    ownedBoms = projectBoms.length;

    if (projectBoms.length > 0) {
      const bomIds = projectBoms.map((b) => b.id);
      const lineRows = await db
        .select({ id: bomLines.id })
        .from(bomLines)
        .where(inArray(bomLines.bomId, bomIds));

      if (lineRows.length > 0) {
        const lineIds = lineRows.map((l) => l.id);
        const attRows = await db
          .select({ id: attachments.id })
          .from(attachments)
          .where(inArray(attachments.bomLineId, lineIds));
        attachmentCount = attRows.length;
      }
    }
  }

  return NextResponse.json({
    ownedProjects: ownedProjects.length,
    ownedBoms,
    ownedTeams: ownedTeams.length,
    attachmentCount,
  });
}
