"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { memberships, workspaces } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export type WorkspaceFormState = { error?: string } | undefined;

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be 50 characters or fewer"),
});

function makeSlug(name: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "workspace";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

export async function createWorkspace(
  _prev: WorkspaceFormState,
  formData: FormData
): Promise<WorkspaceFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const slug = makeSlug(parsed.data.name);

  await db.transaction(async (tx) => {
    const [ws] = await tx
      .insert(workspaces)
      .values({ name: parsed.data.name, slug })
      .returning({ id: workspaces.id });

    await tx
      .insert(memberships)
      .values({ workspaceId: ws.id, userId: user.id, role: "owner" });
  });

  redirect(`/w/${slug}`);
}

// Notes on this file:

// Server actions are public HTTP endpoints. Anyone can call them directly, so the action checks the user itself, instead of trusting that the page only shows the form to logged-in users.
// The transaction: if the membership insert fails, the workspace insert is rolled back. You never end up with an ownerless workspace.
// The random suffix on the slug keeps names like “Marketing” from colliding, and the unique constraint on slug is the safety net.
// redirect() works by throwing, so it’s placed after the transaction.