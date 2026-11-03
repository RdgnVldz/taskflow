import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, FolderKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireWorkspaceAccess } from "@/lib/workspace";
import { getWorkspaceProjects } from "@/lib/projects";
import { hasRole } from "@/lib/roles";
import { CreateProjectForm } from "./create-project-form";

type Params = Promise<{ slug: string }>;

export default function WorkspacePage({ params }: { params: Params }) {
  return (
    <div className="min-h-svh bg-muted/40">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All workspaces
        </Link>

        <Suspense
          fallback={<div className="h-48 animate-pulse rounded-xl bg-muted" />}
        >
          <WorkspaceContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}

async function WorkspaceContent({ params }: { params: Params }) {
  const { slug } = await params;
  const { workspace, role } = await requireWorkspaceAccess(slug);
  const list = await getWorkspaceProjects(workspace.id);
  const isAdmin = hasRole(role, "admin");

  return (
    <div className="grid gap-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{workspace.name}</h1>
        <Badge variant="secondary" className="capitalize">
          {role}
        </Badge>
      </div>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Projects</h2>

        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "No projects yet. Create your first one below."
              : "No projects yet. Ask an admin to create one."}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <Link key={p.id} href={`/w/${slug}/p/${p.id}`}>
                <Card className="h-full transition-colors hover:bg-accent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderKanban className="size-4" />
                      {p.name}
                    </CardTitle>
                    {p.description && (
                      <CardDescription>{p.description}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {isAdmin && <CreateProjectForm slug={slug} />}
    </div>
  );
}