import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { requireWorkspaceAccess } from "@/src/lib/workspace";
import { getProjectInWorkspace, getProjectTasks } from "@/src/lib/projects";
import { CreateTaskForm } from "./create-task-form";
import { TaskCard } from "./task-card";

type Params = Promise<{ slug: string; projectId: string }>;

const COLUMNS = [
  { status: "todo", label: "To do" },
  { status: "in_progress", label: "In progress" },
  { status: "done", label: "Done" },
] as const;

export default function ProjectPage({ params }: { params: Params }) {
  return (
    <div className="min-h-svh bg-muted/40">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Suspense
          fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}
        >
          <Board params={params} />
        </Suspense>
      </main>
    </div>
  );
}

async function Board({ params }: { params: Params }) {
  const { slug, projectId } = await params;
  const { workspace } = await requireWorkspaceAccess(slug);
  const project = await getProjectInWorkspace(workspace.id, projectId);
  const allTasks = await getProjectTasks(project.id);

  return (
    <div className="grid gap-6">
      <div>
        <Link
          href={`/w/${slug}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {workspace.name}
        </Link>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        )}
      </div>

      <CreateTaskForm slug={slug} projectId={project.id} />

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const columnTasks = allTasks.filter((t) => t.status === col.status);
          return (
            <section key={col.status} className="rounded-xl border bg-background p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold">{col.label}</h2>
                <Badge variant="secondary">{columnTasks.length}</Badge>
              </div>
              <div className="grid gap-2">
                {columnTasks.length === 0 ? (
                  <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                    Nothing here
                  </p>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard key={task.id} slug={slug} task={task} />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}