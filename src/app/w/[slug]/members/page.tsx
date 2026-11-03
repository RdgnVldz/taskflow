import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, LogOut, UserMinus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalTime } from "@/components/local-time";
import { getPendingInvites, getWorkspaceMembers } from "@/lib/members";
import { canRemoveMember, hasRole, invitableRoles } from "@/lib/roles";
import { requireWorkspaceAccess } from "@/lib/workspace";
import { changeRole, removeMember, revokeInvite } from "./actions";
import { InviteForm } from "./invite-form";

type Params = Promise<{ slug: string }>;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function MembersPage({ params }: { params: Params }) {
  return (
    <div className="min-h-svh bg-muted/40">
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Suspense
          fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}
        >
          <MembersContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}

async function MembersContent({ params }: { params: Params }) {
  const { slug } = await params;
  const { workspace, user, role } = await requireWorkspaceAccess(slug);
  const isAdmin = hasRole(role, "admin");

  const [members, pending] = await Promise.all([
    getWorkspaceMembers(workspace.id),
    isAdmin ? getPendingInvites(workspace.id) : Promise.resolve([]),
  ]);

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
        <h1 className="text-2xl font-bold">Members</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>People ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {members.map((m) => {
              const isSelf = m.userId === user.id;
              const canRemove = isSelf
                ? m.role !== "owner"
                : canRemoveMember(role, m.role);
              const canChangeRole =
                role === "owner" && !isSelf && m.role !== "owner";

              return (
                <li
                  key={m.userId}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      {initials(m.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {m.name}
                        {isSelf && (
                          <span className="text-muted-foreground"> (you)</span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canChangeRole ? (
                      <form
                        action={changeRole.bind(null, slug, m.userId)}
                        className="flex items-center gap-2"
                      >
                        <select
                          name="role"
                          defaultValue={m.role}
                          aria-label={`Role for ${m.name}`}
                          className="h-8 rounded-md border bg-background px-2 text-sm"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button type="submit" variant="outline" size="sm">
                          Update
                        </Button>
                      </form>
                    ) : (
                      <Badge variant="secondary" className="capitalize">
                        {m.role}
                      </Badge>
                    )}

                    {canRemove && (
                      <form action={removeMember.bind(null, slug, m.userId)}>
                        <Button type="submit" variant="ghost" size="sm">
                          {isSelf ? <LogOut /> : <UserMinus />}
                          {isSelf ? "Leave" : "Remove"}
                        </Button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {isAdmin && pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending invites ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {pending.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires <LocalTime iso={inv.expiresAt.toISOString()} />
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {inv.role}
                    </Badge>
                    <form action={revokeInvite.bind(null, slug, inv.id)}>
                      <Button type="submit" variant="ghost" size="sm">
                        <X />
                        Revoke
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {isAdmin && <InviteForm slug={slug} roles={invitableRoles(role)} />}
    </div>
  );
}