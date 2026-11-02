import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/src/lib/session";
import { logout } from "@/src/app/(auth)/actions";

export default function DashboardPage() {
  return (
    <div className="min-h-svh bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <LayoutDashboard className="size-5" />
            TaskFlow
          </div>
          <Suspense
            fallback={<div className="h-8 w-28 animate-pulse rounded-md bg-muted" />}
          >
            <UserMenu />
          </Suspense>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Suspense
          fallback={<div className="h-32 animate-pulse rounded-xl bg-muted" />}
        >
          <Welcome />
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

async function Welcome() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back, {user.name}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Your workspaces will show up here.
      </CardContent>
    </Card>
  );
}