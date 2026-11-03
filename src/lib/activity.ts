import "server-only";
import { cache } from "react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { activity, users } from "@/db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type ActivityType =
  | "task.created"
  | "task.moved"
  | "task.updated"
  | "comment.added"
  | "member.invited"
  | "member.joined"
  | "member.removed"
  | "member.role_changed";

export async function logActivity(
  tx: Tx,
  entry: {
    workspaceId: string;
    taskId: string | null;
    actorId: string;
    type: ActivityType;
    meta?: Record<string, unknown>;
  }
) {
  await tx.insert(activity).values({ ...entry, meta: entry.meta ?? {} });
}

export const getTaskActivity = cache(async (taskId: string) => {
  return db
    .select({
      id: activity.id,
      type: activity.type,
      meta: activity.meta,
      createdAt: activity.createdAt,
      actorName: users.name,
    })
    .from(activity)
    .leftJoin(users, eq(activity.actorId, users.id))
    .where(eq(activity.taskId, taskId))
    .orderBy(desc(activity.createdAt))
    .limit(50);
});

const STATUS_LABELS: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};
const label = (v: unknown) => STATUS_LABELS[String(v)] ?? String(v);

export function describeActivity(type: string, meta: Record<string, unknown>) {
  switch (type) {
    case "task.created":
      return "created this task";
    case "task.moved":
      return `moved this task from ${label(meta.from)} to ${label(meta.to)}`;
    case "task.updated": {
      const fields = Array.isArray(meta.fields) ? meta.fields.join(", ") : "details";
      return `updated the ${fields}`;
    }
    case "comment.added":
      return "commented";
    default:
      return type;
  }
}