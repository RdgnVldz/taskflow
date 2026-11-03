import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getUserWorkspaces } from "@/lib/workspace";
import { CreateWorkspaceForm } from "./create-workspace-form";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/session";
import { logout } from "@/app/(auth)/actions";

export default function DashboardPage() {
  return (
    <div className="min-h-svh bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <LayoutDashboard className="size-5" />
            TaskFlow
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Suspense
              fallback={<div className="h-8 w-28 animate-pulse rounded-md bg-muted" />}
            >
              <UserMenu />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Suspense
          fallback={<div className="h-32 animate-pulse rounded-xl bg-muted" />}
        >
          <WorkspaceSection />
        </Suspense>
      </main>
    </div>
  );
}

async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
        {initials}
      </div>
      <form action={logout}>
        <Button variant="ghost" size="sm" type="submit">
          <LogOut />
          Log out
        </Button>
      </form>
    </div>
  );
}

async function WorkspaceSection() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const list = await getUserWorkspaces(user.id);

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-bold">Your workspaces</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {user.name}
        </p>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You don&apos;t belong to any workspace yet. Create your first one below.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((w) => (
            <Link key={w.id} href={`/w/${w.slug}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardHeader>
                  <CardTitle>{w.name}</CardTitle>
                  <CardDescription>
                    <Badge variant="secondary" className="capitalize">
                      {w.role}
                    </Badge>
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateWorkspaceForm />
    </div>
  );
}