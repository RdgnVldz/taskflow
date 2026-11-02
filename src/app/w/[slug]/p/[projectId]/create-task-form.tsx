"use client";

import { useActionState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTask } from "../../actions";

export function CreateTaskForm({
  slug,
  projectId,
}: {
  slug: string;
  projectId: string;
}) {
  const [state, formAction, pending] = useActionState(
    createTask.bind(null, slug, projectId),
    undefined
  );

  return (
    <form action={formAction} className="grid gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="title"
          placeholder="Add a task..."
          aria-label="Task title"
          required
          className="bg-background sm:flex-1"
        />
        <select
          name="priority"
          defaultValue="medium"
          aria-label="Priority"
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
          Add task
        </Button>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}