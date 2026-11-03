import "server-only";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { comments, tasks, users } from "@/db/schema";

// projectId must come from an already-verified project (getProjectInWorkspace)
export const getTaskInProject = cache(
  async (projectId: string, taskId: string) => {
    if (!z.uuid().safeParse(taskId).success) notFound();

    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
      .limit(1);

    if (!task) notFound();
    return task;
  }
);

export const getTaskComments = cache(async (taskId: string) => {
  return db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorId: comments.authorId,
      authorName: users.name,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.taskId, taskId))
    .orderBy(comments.createdAt);
});