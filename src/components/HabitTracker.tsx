"use client";

import { useEffect, useMemo, useState } from "react";
import type { AirtableRecord } from "@/lib/airtable";
import type { HabitFields } from "@/app/api/habits/route";
import { useToast } from "@/components/ToastProvider";
import Skeleton from "@/components/Skeleton";

type Habit = AirtableRecord<HabitFields>;

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(toISODate(d));
  }
  return days;
}

const DAYS = lastNDays(7);

export default function HabitTracker() {
  const { showToast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHabitName, setNewHabitName] = useState("");

  async function loadHabits() {
    try {
      setLoading(true);
      const res = await fetch("/api/habits", { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar hábitos");
      setHabits(await res.json());
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHabits();
  }, []);

  const habitNames = useMemo(() => {
    const names = new Set(habits.map((h) => h.fields.Name));
    return Array.from(names).sort();
  }, [habits]);

  function findRecord(name: string, date: string) {
    return habits.find((h) => h.fields.Name === name && h.fields.Date === date);
  }

  function calculateStreak(name: string): number {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const record = findRecord(name, toISODate(d));
      if (record?.fields.Done) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  async function toggleCell(name: string, date: string) {
    const existing = findRecord(name, date);
    try {
      if (existing) {
        const nextDone = !existing.fields.Done;
        setHabits((prev) =>
          prev.map((h) => (h.id === existing.id ? { ...h, fields: { ...h.fields, Done: nextDone } } : h))
        );
        const res = await fetch("/api/habits", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: existing.id, fields: { Done: nextDone } }),
        });
        if (!res.ok) throw new Error("Falha ao atualizar hábito");
      } else {
        const res = await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Name: name, Date: date, Done: true }),
        });
        if (!res.ok) throw new Error("Falha ao criar registro de hábito");
        const record: Habit = await res.json();
        setHabits((prev) => [...prev, record]);
      }
    } catch (e) {
      showToast((e as Error).message);
      await loadHabits();
    }
  }

  async function addHabit(e: React.FormEvent) {
    e.preventDefault();
    const name = newHabitName.trim();
    if (!name || habitNames.includes(name)) return;
    setNewHabitName("");
    await toggleCell(name, DAYS[DAYS.length - 1]);
  }

  return (
    <section className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Hábitos</h2>
        {loading && <span className="text-xs text-neutral-500">Carregando…</span>}
      </div>

      <form onSubmit={addHabit} className="flex gap-2">
        <input
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          placeholder="Novo hábito"
          className="flex-1 rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!newHabitName.trim()}
          className="rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Adicionar
        </button>
      </form>

      {loading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      )}

      {!loading && habitNames.length === 0 && (
        <p className="text-sm text-neutral-500">Nenhum hábito cadastrado ainda.</p>
      )}

      {!loading && habitNames.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left font-medium text-xs text-neutral-500 pb-2 pr-2">Hábito</th>
                {DAYS.map((d) => (
                  <th key={d} className="text-center font-medium text-xs text-neutral-500 pb-2 px-1">
                    {new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "narrow" })}
                  </th>
                ))}
                <th className="text-center font-medium text-xs text-neutral-500 pb-2 pl-2">Streak</th>
              </tr>
            </thead>
            <tbody>
              {habitNames.map((name) => (
                <tr key={name}>
                  <td className="pr-2 py-1 font-medium">{name}</td>
                  {DAYS.map((date) => {
                    const record = findRecord(name, date);
                    return (
                      <td key={date} className="text-center px-1 py-1">
                        <button
                          onClick={() => toggleCell(name, date)}
                          className={`w-6 h-6 rounded-md border transition-colors ${
                            record?.fields.Done
                              ? "bg-green-500 border-green-500"
                              : "border-black/10 dark:border-white/10 hover:border-green-400"
                          }`}
                          aria-label={`${name} em ${date}`}
                        />
                      </td>
                    );
                  })}
                  <td className="text-center pl-2 font-semibold">{calculateStreak(name)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
