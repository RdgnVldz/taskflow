import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getInviteByToken } from "@/lib/members";
import { getCurrentUser } from "@/lib/session";
import { logout } from "@/app/(auth)/actions";
import { acceptInvite } from "./actions";

type Params = Promise<{ token: string }>;

export default function InvitePage({ params }: { params: Params }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-linear-to-b from-primary/10 via-background to-background p-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <LayoutDashboard className="size-5" />
        TaskFlow
      </div>
      <Suspense
        fallback={<div className="h-56 w-full max-w-sm animate-pulse rounded-xl bg-muted" />}
      >
        <InviteCard params={params} />
      </Suspense>
    </main>
  );
}

async function InviteCard({ params }: { params: Params }) {
  const { token } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const invite = await getInviteByToken(token);
  const usable =
    invite && !invite.acceptedAt && invite.expiresAt > new Date();

  if (!invite || !usable) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Invite unavailable</CardTitle>
          <CardDescription>
            This invite link is invalid, expired, or has already been used. Ask
            an admin to send a new one.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            Go to dashboard
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (invite.email !== user.email) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Wrong account</CardTitle>
          <CardDescription>
            This invite was sent to {invite.email}, but you&apos;re logged in as{" "}
            {user.email}. Log out, then open the invite link again with the
            right account.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <form action={logout}>
            <Button type="submit" variant="outline">
              Log out
            </Button>
          </form>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle>Join {invite.workspaceName}</CardTitle>
        <CardDescription>You&apos;ve been invited to this workspace.</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Badge variant="secondary" className="capitalize">
          {invite.role}
        </Badge>
      </CardContent>
      <CardFooter className="justify-center">
        <form action={acceptInvite.bind(null, token)}>
          <Button type="submit">Join workspace</Button>
        </form>
      </CardFooter>
    </Card>
  );
}