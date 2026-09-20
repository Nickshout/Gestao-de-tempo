"use client";

import { useEffect, useState } from "react";
import type { AirtableRecord } from "@/lib/airtable";
import type { TaskFields, TaskStatus, TaskQuadrant } from "@/app/api/tasks/route";
import { useToast } from "@/components/ToastProvider";
import Skeleton from "@/components/Skeleton";

const STATUSES: TaskStatus[] = ["A Fazer", "Em Andamento", "Concluído"];

const QUADRANT_STYLES: Record<TaskQuadrant, string> = {
  Q1: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Q2: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Q3: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Q4: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

type Task = AirtableRecord<TaskFields>;

export default function KanbanBoard() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [suggestedQuadrant, setSuggestedQuadrant] = useState<TaskQuadrant | null>(null);
  const [suggestedJustification, setSuggestedJustification] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const [breakdownTaskId, setBreakdownTaskId] = useState<string | null>(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownSubtasks, setBreakdownSubtasks] = useState<string[]>([]);
  const [breakdownCreating, setBreakdownCreating] = useState(false);

  async function loadTasks() {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar tarefas");
      setTasks(await res.json());
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function suggestQuadrant() {
    if (!title.trim()) return;
    setSuggesting(true);
    try {
      const res = await fetch("/api/ai/suggest-quadrant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, notes }),
      });
      if (!res.ok) throw new Error("Falha ao sugerir prioridade");
      const data = await res.json();
      setSuggestedQuadrant(data.quadrant);
      setSuggestedJustification(data.justification);
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setSuggesting(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Title: title,
          Notes: notes,
          Status: "A Fazer",
          ...(suggestedQuadrant ? { Quadrant: suggestedQuadrant } : {}),
        }),
      });
      if (!res.ok) throw new Error("Falha ao criar tarefa");
      setTitle("");
      setNotes("");
      setSuggestedQuadrant(null);
      setSuggestedJustification(null);
      await loadTasks();
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function moveTask(taskId: string, status: TaskStatus) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, fields: { ...t.fields, Status: status } } : t))
    );
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, fields: { Status: status } }),
      });
      if (!res.ok) throw new Error("Falha ao mover tarefa");
    } catch (e) {
      showToast((e as Error).message);
      await loadTasks();
    }
  }

  function handleDrop(status: TaskStatus) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverStatus(null);
      const taskId = e.dataTransfer.getData("text/plain");
      if (taskId) moveTask(taskId, status);
    };
  }

  async function toggleBreakdown(task: Task) {
    if (breakdownTaskId === task.id) {
      setBreakdownTaskId(null);
      setBreakdownSubtasks([]);
      return;
    }
    setBreakdownTaskId(task.id);
    setBreakdownSubtasks([]);
    setBreakdownLoading(true);
    try {
      const res = await fetch("/api/ai/breakdown-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: task.fields.Title }),
      });
      if (!res.ok) throw new Error("Falha ao desdobrar tarefa");
      const data = await res.json();
      setBreakdownSubtasks(data.subtasks || []);
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setBreakdownLoading(false);
    }
  }

  async function createSubtasksAsTasks() {
    if (breakdownSubtasks.length === 0) return;
    setBreakdownCreating(true);
    try {
      for (const subtask of breakdownSubtasks) {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Title: subtask, Status: "A Fazer" }),
        });
      }
      setBreakdownTaskId(null);
      setBreakdownSubtasks([]);
      await loadTasks();
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setBreakdownCreating(false);
    }
  }

  return (
    <section className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Kanban</h2>
        {loading && <span className="text-xs text-neutral-500">Carregando…</span>}
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSuggestedQuadrant(null);
              setSuggestedJustification(null);
            }}
            placeholder="Nova tarefa"
            className="flex-1 rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas (opcional)"
            className="flex-1 rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={suggestQuadrant}
            disabled={suggesting || !title.trim()}
            className="rounded-md border border-black/10 dark:border-white/10 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {suggesting ? "Sugerindo…" : "IA: sugerir prioridade"}
          </button>
          {suggestedQuadrant && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${QUADRANT_STYLES[suggestedQuadrant]}`}
              title={suggestedJustification || ""}
            >
              Sugestão: {suggestedQuadrant}
            </span>
          )}
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="ml-auto rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
        {suggestedJustification && (
          <p className="text-xs text-neutral-500">{suggestedJustification}</p>
        )}
      </form>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STATUSES.map((status) => (
            <div key={status} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STATUSES.map((status) => {
          const columnTasks = tasks.filter((t) => t.fields.Status === status);
          return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus(status);
            }}
            onDragLeave={() => setDragOverStatus((s) => (s === status ? null : s))}
            onDrop={handleDrop(status)}
            className={`rounded-lg border border-dashed p-2 min-h-[160px] flex flex-col gap-2 transition-colors ${
              dragOverStatus === status
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/10"
                : "border-black/10 dark:border-white/10"
            }`}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 px-1">
              {status}
            </h3>
            {columnTasks.length === 0 && (
              <p className="text-xs text-neutral-400 px-1">Nenhuma tarefa</p>
            )}
            {columnTasks
              .map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                  className="rounded-md border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 p-3 text-sm cursor-grab active:cursor-grabbing"
                >
                  <p className="font-medium">{task.fields.Title}</p>
                  {task.fields.Notes && (
                    <p className="text-xs text-neutral-500 mt-1">{task.fields.Notes}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {task.fields.Quadrant && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${QUADRANT_STYLES[task.fields.Quadrant]}`}
                      >
                        {task.fields.Quadrant}
                      </span>
                    )}
                    <button
                      onClick={() => toggleBreakdown(task)}
                      className="text-[10px] font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 underline underline-offset-2"
                    >
                      IA: desdobrar tarefa
                    </button>
                  </div>

                  {breakdownTaskId === task.id && (
                    <div className="mt-2 rounded-md bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 p-2 flex flex-col gap-2">
                      {breakdownLoading && (
                        <span className="text-xs text-neutral-500">Gerando subtarefas…</span>
                      )}
                      {!breakdownLoading && breakdownSubtasks.length > 0 && (
                        <>
                          <ul className="list-disc list-inside text-xs flex flex-col gap-1">
                            {breakdownSubtasks.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                          <button
                            onClick={createSubtasksAsTasks}
                            disabled={breakdownCreating}
                            className="self-start rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-2 py-1 text-[10px] font-medium disabled:opacity-50"
                          >
                            {breakdownCreating ? "Criando…" : "Criar como novas tarefas"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
          );
        })}
      </div>
      )}
    </section>
  );
}
