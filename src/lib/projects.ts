import "server-only";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";

export const getWorkspaceProjects = cache(async (workspaceId: string) => {
  return db
    .select()
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId))
    .orderBy(projects.createdAt);
});

export const getProjectInWorkspace = cache(
  async (workspaceId: string, projectId: string) => {
    // A malformed id would make Postgres throw, so reject it as a 404 first.
    if (!z.uuid().safeParse(projectId).success) notFound();

    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId))
      )
      .limit(1);

    if (!project) notFound();
    return project;
  }
);

export const getProjectTasks = cache(async (projectId: string) => {
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(tasks.createdAt);
});

// getProjectInWorkspace takes both IDs, so a project ID from another workspace returns nothing.