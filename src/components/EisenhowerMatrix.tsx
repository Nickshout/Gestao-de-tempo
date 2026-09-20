"use client";

import { useEffect, useState } from "react";
import type { AirtableRecord } from "@/lib/airtable";
import type { TaskFields, TaskQuadrant } from "@/app/api/tasks/route";
import { useToast } from "@/components/ToastProvider";
import Skeleton from "@/components/Skeleton";

const QUADRANTS: { id: TaskQuadrant; label: string; hint: string; style: string }[] = [
  {
    id: "Q1",
    label: "Q1 — Urgente e Importante",
    hint: "Faça agora",
    style: "border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10",
  },
  {
    id: "Q2",
    label: "Q2 — Importante, não urgente",
    hint: "Planeje",
    style: "border-blue-300 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/10",
  },
  {
    id: "Q3",
    label: "Q3 — Urgente, não importante",
    hint: "Delegue",
    style: "border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10",
  },
  {
    id: "Q4",
    label: "Q4 — Nem urgente, nem importante",
    hint: "Elimine",
    style: "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40",
  },
];

type Task = AirtableRecord<TaskFields>;

export default function EisenhowerMatrix() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
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
    })();
  }, [showToast]);

  return (
    <section className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Matriz de Eisenhower</h2>
        {loading && <span className="text-xs text-neutral-500">Carregando…</span>}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUADRANTS.map((q) => (
            <Skeleton key={q.id} className="h-[120px] w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUADRANTS.map((q) => {
            const quadrantTasks = tasks.filter((t) => t.fields.Quadrant === q.id);
            return (
              <div key={q.id} className={`rounded-lg border p-3 min-h-[120px] flex flex-col gap-2 ${q.style}`}>
                <div>
                  <h3 className="text-xs font-semibold">{q.label}</h3>
                  <p className="text-[10px] text-neutral-500">{q.hint}</p>
                </div>
                <div className="flex flex-col gap-1">
                  {quadrantTasks.length === 0 && (
                    <p className="text-[10px] text-neutral-400">Nenhuma tarefa</p>
                  )}
                  {quadrantTasks.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-md bg-white/70 dark:bg-black/20 px-2 py-1 text-xs"
                    >
                      {t.fields.Title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
