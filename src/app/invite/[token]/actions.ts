"use server";

import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { invites, memberships, workspaces } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { hashInviteToken } from "@/lib/members";
import { getCurrentUser } from "@/lib/session";

export async function acceptInvite(token: string, _formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const slug = await db.transaction(async (tx) => {
    // Claim the invite atomically: only one request can flip accepted_at from null
    const [invite] = await tx
      .update(invites)
      .set({ acceptedAt: new Date() })
      .where(
        and(
          eq(invites.tokenHash, hashInviteToken(token)),
          isNull(invites.acceptedAt),
          gt(invites.expiresAt, new Date()),
          eq(invites.email, user.email)
        )
      )
      .returning({ workspaceId: invites.workspaceId, role: invites.role });

    if (!invite) return null;

    await tx
      .insert(memberships)
      .values({
        workspaceId: invite.workspaceId,
        userId: user.id,
        role: invite.role,
      })
      .onConflictDoNothing();

    await logActivity(tx, {
      workspaceId: invite.workspaceId,
      taskId: null,
      actorId: user.id,
      type: "member.joined",
      meta: { role: invite.role },
    });

    const [ws] = await tx
      .select({ slug: workspaces.slug })
      .from(workspaces)
      .where(eq(workspaces.id, invite.workspaceId))
      .limit(1);

    return ws.slug;
  });

  if (!slug) redirect(`/invite/${token}`);
  redirect(`/w/${slug}`);
}