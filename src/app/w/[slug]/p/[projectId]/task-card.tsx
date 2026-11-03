"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { tasks } from "@/db/schema";
import { deleteTask } from "../../actions";

type Task = typeof tasks.$inferSelect;

const priorityVariant = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
} as const;

export function TaskCard({
  slug,
  task,
  handle,
  overlay = false,
}: {
  slug: string;
  task: Task;
  handle?: React.ReactNode;
  overlay?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border bg-card p-3 text-card-foreground shadow-xs",
        overlay && "shadow-lg ring-1 ring-primary/20"
      )}
    >
      {handle ?? (
        <GripVertical className="mt-0.5 size-4 text-muted-foreground" />
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium break-words">{task.title}</p>

        <div className="mt-3 flex items-center justify-between">
          <Badge variant={priorityVariant[task.priority]} className="capitalize">
            {task.priority}
          </Badge>

          {!overlay && (
            <form action={deleteTask.bind(null, slug, task.id)}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label="Delete task"
              >
                <Trash2 />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function SortableTask({ slug, task }: { slug: string; task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
    >
      <TaskCard
        slug={slug}
        task={task}
        handle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Drag task: ${task.title}`}
            className="mt-0.5 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="size-4" />
          </button>
        }
      />
    </div>
  );
}