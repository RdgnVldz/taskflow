import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireWorkspaceAccess } from "@/lib/workspace";
import { getProjectInWorkspace, getProjectTasks } from "@/lib/projects";
import { CreateTaskForm } from "./create-task-form";
import { KanbanBoard } from "./kanban-board";

type Params = Promise<{ slug: string; projectId: string }>;

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

      <KanbanBoard slug={slug} tasks={allTasks} />
    </div>
  );
}