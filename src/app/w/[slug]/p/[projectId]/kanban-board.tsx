"use client";

import { startTransition, useOptimistic, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { tasks as tasksTable } from "@/db/schema";
import { reorderTask } from "../../actions";
import { SortableTask, TaskCard } from "./task-card";

type Task = typeof tasksTable.$inferSelect;
type Status = Task["status"];

const COLUMNS: { status: Status; label: string }[] = [
  { status: "todo", label: "To do" },
  { status: "in_progress", label: "In progress" },
  { status: "done", label: "Done" },
];
const STATUSES = COLUMNS.map((c) => c.status);
const GAP = 1024;

function positionBetween(prev: number | undefined, next: number | undefined) {
  if (prev === undefined && next === undefined) return GAP;
  if (prev === undefined) return (next as number) / 2;
  if (next === undefined) return prev + GAP;
  return (prev + next) / 2;
}

export function KanbanBoard({ slug, tasks }: { slug: string; tasks: Task[] }) {
  const [optimisticTasks, applyMove] = useOptimistic(
    tasks,
    (current, move: { id: string; status: Status; position: number }) =>
      current.map((t) =>
        t.id === move.id
          ? { ...t, status: move.status, position: move.position }
          : t
      )
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns = Object.fromEntries(
    STATUSES.map((s) => [
      s,
      optimisticTasks
        .filter((t) => t.status === s)
        .sort((a, b) => a.position - b.position),
    ])
  ) as Record<Status, Task[]>;

  const draggedTask = activeId
    ? optimisticTasks.find((t) => t.id === activeId)
    : undefined;

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    const moved = optimisticTasks.find((t) => t.id === active.id);
    if (!moved) return;

    // "over" is either another task card or a column itself
    const overTask = optimisticTasks.find((t) => t.id === over.id);
    const targetStatus = overTask
      ? overTask.status
      : STATUSES.find((s) => s === over.id);
    if (!targetStatus) return;

    let ordered: Task[];
    if (targetStatus === moved.status) {
      const column = columns[targetStatus];
      const from = column.findIndex((t) => t.id === moved.id);
      const to = overTask
        ? column.findIndex((t) => t.id === overTask.id)
        : column.length - 1;
      if (from === to) return;
      ordered = arrayMove(column, from, to);
    } else {
      ordered = [...columns[targetStatus]];
      const to = overTask
        ? ordered.findIndex((t) => t.id === overTask.id)
        : ordered.length;
      ordered.splice(to, 0, moved);
    }

    const index = ordered.findIndex((t) => t.id === moved.id);
    const position = positionBetween(
      ordered[index - 1]?.position,
      ordered[index + 1]?.position
    );

    setError(null);
    startTransition(async () => {
      applyMove({ id: moved.id, status: targetStatus, position });
      try {
        const result = await reorderTask(slug, moved.id, targetStatus, position);
        if (result.error) setError(result.error);
      } catch {
        setError("Couldn't save that change. It was reverted.");
      }
    });
  }

  return (
    <div className="grid gap-3">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <DndContext
        id="kanban-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => setActiveId(String(active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <Column
              key={col.status}
              slug={slug}
              status={col.status}
              label={col.label}
              tasks={columns[col.status]}
            />
          ))}
        </div>

        <DragOverlay>
          {draggedTask ? (
            <TaskCard slug={slug} task={draggedTask} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({
  slug,
  status,
  label,
  tasks,
}: {
  slug: string;
  status: Status;
  label: string;
  tasks: Task[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "rounded-xl border bg-background p-3 transition-colors",
        isOver && "bg-accent/50"
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold">{label}</h2>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid min-h-24 content-start gap-2">
          {tasks.length === 0 ? (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground">
              Nothing here
            </p>
          ) : (
            tasks.map((task) => (
              <SortableTask key={task.id} slug={slug} task={task} />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}