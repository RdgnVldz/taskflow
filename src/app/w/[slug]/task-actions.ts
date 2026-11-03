"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { comments, projects, tasks } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { hasRole } from "@/lib/roles";
import { requireWorkspaceAccess } from "@/lib/workspace";

export type TaskFormState =
  | {
      error?: string;
      success?: boolean;
      values?: { title: string; description: string; priority: string };
    }
  | undefined;

const updateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000, "Description is too long"),
  priority: z.enum(["low", "medium", "high"]),
});

const commentSchema = z.object({
  body: z.string().trim().min(1, "Write something first").max(2000),
});

// Finds a task only if it belongs to a project in this workspace
async function findTask(workspaceId: string, taskId: string) {
  if (!z.uuid().safeParse(taskId).success) return undefined;

  const [row] = await db
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(and(eq(tasks.id, taskId), eq(projects.workspaceId, workspaceId)))
    .limit(1);

  return row?.task;
}

export async function updateTask(
  slug: string,
  taskId: string,
  _prev: TaskFormState,
  formData: FormData
): Promise<TaskFormState> {
  const { workspace, user } = await requireWorkspaceAccess(slug);

  const raw = Object.fromEntries(formData);
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) {
    // return what was typed so the form doesn't reset and lose it
    return {
      error: parsed.error.issues[0].message,
      values: {
        title: String(raw.title ?? ""),
        description: String(raw.description ?? ""),
        priority: String(raw.priority ?? "medium"),
      },
    };
  }

  const current = await findTask(workspace.id, taskId);
  if (!current) return { error: "Task not found" };

  const { title, priority } = parsed.data;
  const description = parsed.data.description === "" ? null : parsed.data.description;

  const fields: string[] = [];
  if (title !== current.title) fields.push("title");
  if (description !== current.description) fields.push("description");
  if (priority !== current.priority) fields.push("priority");
  if (fields.length === 0) return { success: true };

  await db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({ title, description, priority, updatedAt: new Date() })
      .where(eq(tasks.id, current.id));

    await logActivity(tx, {
      workspaceId: workspace.id,
      taskId: current.id,
      actorId: user.id,
      type: "task.updated",
      meta: { fields },
    });
  });

  revalidatePath(`/w/${slug}`, "layout");
  return { success: true };
}

export async function addComment(
  slug: string,
  taskId: string,
  _prev: TaskFormState,
  formData: FormData
): Promise<TaskFormState> {
  const { workspace, user } = await requireWorkspaceAccess(slug);

  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const task = await findTask(workspace.id, taskId);
  if (!task) return { error: "Task not found" };

  await db.transaction(async (tx) => {
    const [comment] = await tx
      .insert(comments)
      .values({ taskId: task.id, authorId: user.id, body: parsed.data.body })
      .returning({ id: comments.id });

    await logActivity(tx, {
      workspaceId: workspace.id,
      taskId: task.id,
      actorId: user.id,
      type: "comment.added",
      meta: { commentId: comment.id },
    });
  });

  revalidatePath(`/w/${slug}`, "layout");
  return { success: true };
}

export async function deleteComment(
  slug: string,
  commentId: string,
  _formData: FormData
) {
  const { workspace, user, role } = await requireWorkspaceAccess(slug);
  if (!z.uuid().safeParse(commentId).success) return;

  // comment -> task -> project -> workspace proves it belongs to this workspace
  const [row] = await db
    .select({ id: comments.id, authorId: comments.authorId })
    .from(comments)
    .innerJoin(tasks, eq(comments.taskId, tasks.id))
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(eq(comments.id, commentId), eq(projects.workspaceId, workspace.id))
    )
    .limit(1);

  if (!row) return;
  if (row.authorId !== user.id && !hasRole(role, "admin")) return;

  await db.delete(comments).where(eq(comments.id, row.id));
  revalidatePath(`/w/${slug}`, "layout");
}