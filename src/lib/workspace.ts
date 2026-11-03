import "server-only";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { memberships, workspaces } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export const getUserWorkspaces = cache(async (userId: string) => {
  return db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(workspaces, eq(memberships.workspaceId, workspaces.id))
    .where(eq(memberships.userId, userId))
    .orderBy(workspaces.name);
});

export const requireWorkspaceAccess = cache(async (slug: string) => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [row] = await db
    .select({ workspace: workspaces, role: memberships.role })
    .from(workspaces)
    .innerJoin(memberships, eq(memberships.workspaceId, workspaces.id))
    .where(and(eq(workspaces.slug, slug), eq(memberships.userId, user.id)))
    .limit(1);

  if (!row) notFound();

  return { user, workspace: row.workspace, role: row.role };
});

// Two details here matter:

// The query uses the memberships_user_id_idx index we created in Milestone 1, because it filters by user_id.
// A non-member gets a 404, not a 403. This means an outsider can’t tell the difference between a workspace that exists and one that doesn’t, so they can’t discover which workspace slugs exist. This is called tenant isolation: one customer’s data is invisible to another.