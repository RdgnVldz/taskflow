"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createInvite } from "./actions";

export function InviteForm({
  slug,
  roles,
}: {
  slug: string;
  roles: ("admin" | "member")[];
}) {
  const [state, formAction, pending] = useActionState(
    createInvite.bind(null, slug),
    undefined
  );
  const [copied, setCopied] = useState(false);

  const link = state?.token
    ? `${window.location.origin}/invite/${state.token}`
    : null;

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite someone</CardTitle>
        <CardDescription>
          You&apos;ll get a link to send them. It works once, for 7 days, and
          only for the email you enter.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form action={formAction} className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div className="grid gap-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="teammate@example.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              name="role"
              defaultValue="member"
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r === "admin" ? "Admin" : "Member"}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Send />}
            Create invite
          </Button>
        </form>

        {state?.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}

        {link && (
          <div className="grid gap-2 rounded-lg border bg-muted/50 p-3">
            <p className="text-sm font-medium">Invite link (shown only once)</p>
            <div className="flex gap-2">
              <Input readOnly value={link} aria-label="Invite link" />
              <Button type="button" variant="outline" onClick={copy}>
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}