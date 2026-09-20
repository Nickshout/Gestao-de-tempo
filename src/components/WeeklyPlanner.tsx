"use client";

import { useEffect, useState } from "react";
import type { AirtableRecord } from "@/lib/airtable";
import type { WeeklyPlanFields, WeeklyPlanDay, WeeklyPlanBlock } from "@/app/api/weekly-plan/route";
import { useToast } from "@/components/ToastProvider";
import Skeleton from "@/components/Skeleton";

const DAYS: WeeklyPlanDay[] = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const BLOCK_STYLES: Record<WeeklyPlanBlock, string> = {
  Foco: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Reunião: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Admin: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Descanso: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

type WeeklyPlanItem = AirtableRecord<WeeklyPlanFields>;

export default function WeeklyPlanner() {
  const { showToast } = useToast();
  const [items, setItems] = useState<WeeklyPlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/weekly-plan", { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao carregar planejamento semanal");
        setItems(await res.json());
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
        <h2 className="text-lg font-semibold">Planejamento Semanal</h2>
        {loading && <span className="text-xs text-neutral-500">Carregando…</span>}
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day) => (
            <div key={day} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {items.length === 0 && (
            <p className="text-sm text-neutral-500">Nenhum bloco planejado ainda.</p>
          )}
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-2 min-w-[420px]">
              {DAYS.map((day) => (
                <div key={day} className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 text-center">
                    {day}
                  </h3>
                  <div className="flex flex-col gap-1 min-h-[80px]">
                    {items
                      .filter((i) => i.fields.Day === day)
                      .map((item) => (
                        <div
                          key={item.id}
                          className={`rounded-md px-2 py-1 text-[11px] font-medium ${BLOCK_STYLES[item.fields.Block]}`}
                          title={item.fields.Block}
                        >
                          {item.fields.Label}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
