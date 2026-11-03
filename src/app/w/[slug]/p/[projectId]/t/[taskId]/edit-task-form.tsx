"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateTask } from "@/app/w/[slug]/task-actions";
import type { tasks } from "@/db/schema";

type Task = typeof tasks.$inferSelect;

export function EditTaskForm({ slug, task }: { slug: string; task: Task }) {
  const [state, formAction, pending] = useActionState(
    updateTask.bind(null, slug, task.id),
    undefined
  );
  const values = state?.values;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={values?.title ?? task.title}
              required
              maxLength={200}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={5}
              placeholder="Add more detail..."
              defaultValue={values?.description ?? task.description ?? ""}
              maxLength={5000}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              name="priority"
              defaultValue={values?.priority ?? task.priority}
              className="h-9 w-40 rounded-md border bg-background px-3 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              Save changes
            </Button>
            {state?.success && (
              <span className="text-sm text-muted-foreground">Saved</span>
            )}
            {state?.error && (
              <span role="alert" className="text-sm text-destructive">
                {state.error}
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}