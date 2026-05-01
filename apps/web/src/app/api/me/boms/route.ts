/**
 * GET /api/me/boms
 * Returns the list of BOMs the current user can access, grouped by project.
 * Used by the browser extension popup to let the user pick a target BOM.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, boms, projects, projectMembers } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const rows = await db
    .select({
      bomId: boms.id,
      bomName: boms.name,
      bomStatus: boms.status,
      projectId: projects.id,
      projectName: projects.name,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projects.id, projectMembers.projectId))
    .innerJoin(boms, eq(boms.projectId, projects.id))
    .where(eq(projectMembers.userId, userId))
    .orderBy(projects.name, boms.name);

  return NextResponse.json({ boms: rows });
}
