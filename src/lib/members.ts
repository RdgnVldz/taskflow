import "server-only";
import { createHash } from "node:crypto";
import { cache } from "react";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { invites, memberships, users, workspaces } from "@/db/schema";

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export const getWorkspaceMembers = cache(async (workspaceId: string) => {
  return db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      role: memberships.role,
      joinedAt: memberships.createdAt,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.workspaceId, workspaceId))
    .orderBy(memberships.createdAt);
});

export const getPendingInvites = cache(async (workspaceId: string) => {
  return db
    .select({
      id: invites.id,
      email: invites.email,
      role: invites.role,
      expiresAt: invites.expiresAt,
    })
    .from(invites)
    .where(
      and(
        eq(invites.workspaceId, workspaceId),
        isNull(invites.acceptedAt),
        gt(invites.expiresAt, new Date())
      )
    )
    .orderBy(invites.createdAt);
});

export const getInviteByToken = cache(async (token: string) => {
  const [row] = await db
    .select({
      id: invites.id,
      email: invites.email,
      role: invites.role,
      expiresAt: invites.expiresAt,
      acceptedAt: invites.acceptedAt,
      workspaceName: workspaces.name,
    })
    .from(invites)
    .innerJoin(workspaces, eq(invites.workspaceId, workspaces.id))
    .where(eq(invites.tokenHash, hashInviteToken(token)))
    .limit(1);

  return row;
});