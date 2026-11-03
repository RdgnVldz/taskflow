"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addComment } from "@/app/w/[slug]/task-actions";

export function CommentForm({ slug, taskId }: { slug: string; taskId: string }) {
  const [state, formAction, pending] = useActionState(
    addComment.bind(null, slug, taskId),
    undefined
  );

  return (
    <form action={formAction} className="grid gap-2">
      <Label htmlFor="body" className="sr-only">
        Add a comment
      </Label>
      <Textarea
        id="body"
        name="body"
        rows={3}
        maxLength={2000}
        placeholder="Write a comment..."
        required
      />
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="justify-self-end">
        {pending && <Loader2 className="animate-spin" />}
        Comment
      </Button>
    </form>
  );
}