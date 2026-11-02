import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { tasks } from "@/src/db/schema";
import { deleteTask, moveTask } from "../../actions";

type Task = typeof tasks.$inferSelect;

const ORDER = ["todo", "in_progress", "done"] as const;

const priorityVariant = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
} as const;

export function TaskCard({ slug, task }: { slug: string; task: Task }) {
  const index = ORDER.indexOf(task.status);
  const prev = ORDER[index - 1];
  const next = ORDER[index + 1];

  return (
    <div className="rounded-lg border bg-card p-3 text-card-foreground shadow-xs">
      <p className="text-sm font-medium">{task.title}</p>

      <div className="mt-3 flex items-center justify-between">
        <Badge variant={priorityVariant[task.priority]} className="capitalize">
          {task.priority}
        </Badge>

        <div className="flex items-center">
          {prev && (
            <form action={moveTask.bind(null, slug, task.id, prev)}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Move left">
                <ChevronLeft />
              </Button>
            </form>
          )}
          {next && (
            <form action={moveTask.bind(null, slug, task.id, next)}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Move right">
                <ChevronRight />
              </Button>
            </form>
          )}
          <form action={deleteTask.bind(null, slug, task.id)}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Delete task">
              <Trash2 />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}