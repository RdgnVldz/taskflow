"use client";

import { useActionState } from "react";
import { Loader2, Plus } from "lucide-react";
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
import { createWorkspace } from "./actions";

export function CreateWorkspaceForm() {
  const [state, formAction, pending] = useActionState(createWorkspace, undefined);

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Create a workspace</CardTitle>
        <CardDescription>
          A workspace holds your projects and team members.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Workspace name</Label>
            <Input id="name" name="name" placeholder="Acme Inc." required />
          </div>
          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Plus />}
            {pending ? "Creating..." : "Create workspace"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}