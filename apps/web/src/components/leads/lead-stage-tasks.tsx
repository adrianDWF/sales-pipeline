"use client";

import type { LeadStatus, LeadTask } from "@sales-pipeline/shared";
import { getStageLabel } from "@sales-pipeline/shared";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addLeadTaskAction, toggleLeadTaskAction } from "@/app/(app)/leads/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export function LeadStageTasks({
  leadId,
  stage,
  tasks,
}: {
  leadId: string;
  stage: LeadStatus;
  tasks: LeadTask[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newTask, setNewTask] = useState("");
  const stageTasks = tasks.filter((t) => t.stage === stage);

  function toggle(taskId: string, completed: boolean) {
    startTransition(async () => {
      await toggleLeadTaskAction(taskId, completed);
      router.refresh();
    });
  }

  function addTask() {
    if (!newTask.trim()) return;
    startTransition(async () => {
      await addLeadTaskAction(leadId, newTask.trim(), stage);
      setNewTask("");
      router.refresh();
    });
  }

  return (
    <div className="bg-card border-border mt-4 rounded-xl border p-4">
      <h3 className="mb-3 text-sm font-semibold">
        Cerințe · {getStageLabel(stage)}
      </h3>
      <ul className="space-y-2">
        {stageTasks.map((task) => (
          <li key={task.id} className="flex items-start gap-2">
            <Checkbox
              checked={task.completed}
              disabled={isPending}
              onCheckedChange={(checked) => toggle(task.id, checked === true)}
            />
            <span className={task.completed ? "text-muted-foreground line-through text-sm" : "text-sm"}>
              {task.title}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <Input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Task nou"
          className="h-8 text-sm"
        />
        <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={addTask}>
          {isPending ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
        </Button>
      </div>
    </div>
  );
}
