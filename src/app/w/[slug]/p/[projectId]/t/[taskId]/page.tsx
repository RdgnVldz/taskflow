import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalTime } from "@/components/local-time";
import { describeActivity, getTaskActivity } from "@/lib/activity";
import { getProjectInWorkspace } from "@/lib/projects";
import { getTaskComments, getTaskInProject } from "@/lib/tasks";
import { hasRole } from "@/lib/roles";
import { requireWorkspaceAccess } from "@/lib/workspace";
import { deleteComment } from "@/app/w/[slug]/task-actions";
import { CommentForm } from "./comment-form";
import { EditTaskForm } from "./edit-task-form";

type Params = Promise<{ slug: string; projectId: string; taskId: string }>;

const STATUS_LABELS = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
} as const;

export default function TaskPage({ params }: { params: Params }) {
  return (
    <div className="min-h-svh bg-muted/40">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Suspense
          fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}
        >
          <TaskContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}

async function TaskContent({ params }: { params: Params }) {
  const { slug, projectId, taskId } = await params;
  const { workspace, user, role } = await requireWorkspaceAccess(slug);
  const project = await getProjectInWorkspace(workspace.id, projectId);
  const task = await getTaskInProject(project.id, taskId);
  const [taskComments, events] = await Promise.all([
    getTaskComments(task.id),
    getTaskActivity(task.id),
  ]);
  const isAdmin = hasRole(role, "admin");

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/w/${slug}/p/${project.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {project.name}
        </Link>
        <Badge variant="secondary">{STATUS_LABELS[task.status]}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid content-start gap-6 lg:col-span-2">
          <EditTaskForm slug={slug} task={task} />

          <Card>
            <CardHeader>
              <CardTitle>Comments ({taskComments.length})</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {taskComments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              ) : (
                taskComments.map((c) => (
                  <div key={c.id} className="grid gap-1 rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        <span className="font-medium text-foreground">
                          {c.authorName ?? "Deleted user"}
                        </span>
                        {" · "}
                        <LocalTime iso={c.createdAt.toISOString()} />
                      </span>
                      {(c.authorId === user.id || isAdmin) && (
                        <form action={deleteComment.bind(null, slug, c.id)}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            aria-label="Delete comment"
                          >
                            <Trash2 />
                          </Button>
                        </form>
                      )}
                    </div>
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {c.body}
                    </p>
                  </div>
                ))
              )}
              <CommentForm slug={slug} taskId={task.id} />
            </CardContent>
          </Card>
        </div>

        <Card className="content-start">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ol className="grid gap-4">
                {events.map((e) => (
                  <li key={e.id} className="text-sm">
                    <p>
                      <span className="font-medium">{e.actorName ?? "Someone"}</span>{" "}
                      {describeActivity(e.type, e.meta)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <LocalTime iso={e.createdAt.toISOString()} />
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}