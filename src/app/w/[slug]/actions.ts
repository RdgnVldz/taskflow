"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { requireWorkspaceAccess } from "@/lib/workspace";
import { hasRole } from "@/lib/roles";
import { logActivity } from "@/lib/activity";

export type FormState = { error?: string } | undefined;

const projectSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  description: z.string().trim().max(500).optional(),
});

const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  priority: z.enum(["low", "medium", "high"]),
});

const statusSchema = z.enum(["todo", "in_progress", "done"]);

// All project ids that belong to this workspace (used as a subquery)
function workspaceProjectIds(workspaceId: string) {
  return db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId));
}

export async function createProject(
  slug: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { workspace, role } = await requireWorkspaceAccess(slug);
  if (!hasRole(role, "admin")) {
    return { error: "Only admins and owners can create projects" };
  }

  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const [project] = await db
    .insert(projects)
    .values({
      workspaceId: workspace.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .returning({ id: projects.id });

  redirect(`/w/${slug}/p/${project.id}`);
}

export async function createTask(
  slug: string,
  projectId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { workspace, user } = await requireWorkspaceAccess(slug);

  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const id = z.uuid().safeParse(projectId);
  if (!id.success) return { error: "Project not found" };

  const [owned] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(eq(projects.id, id.data), eq(projects.workspaceId, workspace.id))
    )
    .limit(1);
  if (!owned) return { error: "Project not found" };

  const [{ last }] = await db
    .select({ last: sql<number>`coalesce(max(${tasks.position}), 0)` })
    .from(tasks)
    .where(and(eq(tasks.projectId, id.data), eq(tasks.status, "todo")));

  await db.transaction(async (tx) => {
    const [task] = await tx
      .insert(tasks)
      .values({
        projectId: id.data,
        title: parsed.data.title,
        priority: parsed.data.priority,
        createdBy: user.id,
        position: Number(last) + 1024,
      })
      .returning({ id: tasks.id });

    await logActivity(tx, {
      workspaceId: workspace.id,
      taskId: task.id,
      actorId: user.id,
      type: "task.created",
      meta: { title: parsed.data.title },
    });
  });

  revalidatePath(`/w/${slug}`, "layout");
}

export async function reorderTask(
  slug: string,
  taskId: string,
  status: string,
  position: number
): Promise<{ error?: string }> {
  const { workspace, user } = await requireWorkspaceAccess(slug);

  const id = z.uuid().safeParse(taskId);
  const newStatus = statusSchema.safeParse(status);
  const newPosition = z.number().finite().safeParse(position);
  if (!id.success || !newStatus.success || !newPosition.success) {
    return { error: "Invalid move" };
  }

  const result: { error?: string } = await db.transaction(async (tx) => {
    const [current] = await tx
      .select({ status: tasks.status })
      .from(tasks)
      .where(
        and(
          eq(tasks.id, id.data),
          inArray(tasks.projectId, workspaceProjectIds(workspace.id))
        )
      )
      .limit(1);

    if (!current) return { error: "Task not found" };

    await tx
      .update(tasks)
      .set({
        status: newStatus.data,
        position: newPosition.data,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id.data));

    if (current.status !== newStatus.data) {
      await logActivity(tx, {
        workspaceId: workspace.id,
        taskId: id.data,
        actorId: user.id,
        type: "task.moved",
        meta: { from: current.status, to: newStatus.data },
      });
    }

    return {};
  });

  if (!result.error) revalidatePath(`/w/${slug}`, "layout");
  return result;
}

export async function deleteTask(
  slug: string,
  taskId: string,
  _formData: FormData
) {
  const { workspace } = await requireWorkspaceAccess(slug);

  const id = z.uuid().safeParse(taskId);
  if (!id.success) return;

  await db
    .delete(tasks)
    .where(
      and(
        eq(tasks.id, id.data),
        inArray(tasks.projectId, workspaceProjectIds(workspace.id))
      )
    );

  revalidatePath(`/w/${slug}`, "layout");
}

// The key idea is in moveTask and deleteTask. They don’t look up the task first and then check ownership. 
// The WHERE clause includes project_id IN (this workspace's projects), 
// so one query does both jobs and a task from another workspace simply doesn’t match. 
// Also, every action begins with requireWorkspaceAccess, because server actions are public endpoints and 
// can be called without your UI.