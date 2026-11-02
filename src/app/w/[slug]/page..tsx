import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { requireWorkspaceAccess } from "@/src/lib/workspace";
import { hasRole } from "@/src/lib/roles";

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
          fallback={<div className="h-24 animate-pulse rounded-xl bg-muted" />}
        >
          <WorkspaceHeader params={params} />
        </Suspense>
      </main>
    </div>
  );
}

async function WorkspaceHeader({ params }: { params: Params }) {
  const { slug } = await params;
  const { workspace, role } = await requireWorkspaceAccess(slug);

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{workspace.name}</h1>
        <Badge variant="secondary" className="capitalize">
          {role}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {hasRole(role, "admin")
          ? "You can manage members and settings here (coming soon)."
          : "You're a member of this workspace."}
      </p>
    </div>
  );
}