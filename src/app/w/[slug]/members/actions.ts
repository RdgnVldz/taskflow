"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { invites, memberships, users } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { hashInviteToken } from "@/lib/members";
import { canRemoveMember, hasRole, invitableRoles } from "@/lib/roles";
import { requireWorkspaceAccess } from "@/lib/workspace";

export type InviteState = { error?: string; token?: string } | undefined;

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  role: z.enum(["admin", "member"]),
});

const roleSchema = z.object({ role: z.enum(["admin", "member"]) });

export async function createInvite(
  slug: string,
  _prev: InviteState,
  formData: FormData
): Promise<InviteState> {
  const { workspace, user, role } = await requireWorkspaceAccess(slug);
  if (!hasRole(role, "admin")) {
    return { error: "Only admins and owners can invite people" };
  }

  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, role: inviteRole } = parsed.data;

  if (!invitableRoles(role).includes(inviteRole)) {
    return { error: "You can't invite someone with that role" };
  }

  const [existing] = await db
    .select({ id: memberships.userId })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(and(eq(memberships.workspaceId, workspace.id), eq(users.email, email)))
    .limit(1);
  if (existing) return { error: "That person is already a member" };

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.transaction(async (tx) => {
    // re-inviting the same email replaces the old pending invite
    await tx
      .delete(invites)
      .where(
        and(
          eq(invites.workspaceId, workspace.id),
          eq(invites.email, email),
          isNull(invites.acceptedAt)
        )
      );

    await tx.insert(invites).values({
      workspaceId: workspace.id,
      email,
      role: inviteRole,
      tokenHash: hashInviteToken(token),
      invitedBy: user.id,
      expiresAt,
    });

    await logActivity(tx, {
      workspaceId: workspace.id,
      taskId: null,
      actorId: user.id,
      type: "member.invited",
      meta: { email, role: inviteRole },
    });
  });

  revalidatePath(`/w/${slug}/members`);
  return { token };
}

export async function revokeInvite(
  slug: string,
  inviteId: string,
  _formData: FormData
) {
  const { workspace, role } = await requireWorkspaceAccess(slug);
  if (!hasRole(role, "admin")) return;
  if (!z.uuid().safeParse(inviteId).success) return;

  await db
    .delete(invites)
    .where(
      and(
        eq(invites.id, inviteId),
        eq(invites.workspaceId, workspace.id),
        isNull(invites.acceptedAt)
      )
    );

  revalidatePath(`/w/${slug}/members`);
}

export async function changeRole(
  slug: string,
  userId: string,
  formData: FormData
) {
  const { workspace, user, role } = await requireWorkspaceAccess(slug);
  if (role !== "owner") return;
  if (userId === user.id) return;

  const parsed = roleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || !z.uuid().safeParse(userId).success) return;

  await db.transaction(async (tx) => {
    const updated = await tx
      .update(memberships)
      .set({ role: parsed.data.role })
      .where(
        and(
          eq(memberships.workspaceId, workspace.id),
          eq(memberships.userId, userId),
          ne(memberships.role, "owner")
        )
      )
      .returning({ userId: memberships.userId });

    if (updated.length > 0) {
      await logActivity(tx, {
        workspaceId: workspace.id,
        taskId: null,
        actorId: user.id,
        type: "member.role_changed",
        meta: { userId, role: parsed.data.role },
      });
    }
  });

  revalidatePath(`/w/${slug}/members`);
}

export async function removeMember(
  slug: string,
  userId: string,
  _formData: FormData
) {
  const { workspace, user, role } = await requireWorkspaceAccess(slug);
  if (!z.uuid().safeParse(userId).success) return;

  const [target] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(
        eq(memberships.workspaceId, workspace.id),
        eq(memberships.userId, userId)
      )
    )
    .limit(1);
  if (!target) return;

  const isSelf = userId === user.id;
  const allowed = isSelf
    ? target.role !== "owner"
    : canRemoveMember(role, target.role);
  if (!allowed) return;

  await db.transaction(async (tx) => {
    await tx
      .delete(memberships)
      .where(
        and(
          eq(memberships.workspaceId, workspace.id),
          eq(memberships.userId, userId)
        )
      );

    await logActivity(tx, {
      workspaceId: workspace.id,
      taskId: null,
      actorId: user.id,
      type: "member.removed",
      meta: { userId, left: isSelf },
    });
  });

  if (isSelf) redirect("/dashboard");
  revalidatePath(`/w/${slug}/members`);
}