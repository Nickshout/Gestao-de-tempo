"use client";

import { useEffect, useState } from "react";
import type { AirtableRecord } from "@/lib/airtable";
import type { MetricsFields } from "@/app/api/metrics/route";
import { useToast } from "@/components/ToastProvider";
import Skeleton from "@/components/Skeleton";

type Metric = AirtableRecord<MetricsFields>;

function formatDay(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function Dashboard() {
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/metrics", { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao carregar métricas");
        const all: Metric[] = await res.json();
        setMetrics(all.slice(-7));
      } catch (e) {
        showToast((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  async function generateWeeklySummary() {
    try {
      setSummaryLoading(true);
      const res = await fetch("/api/ai/weekly-summary", { method: "POST" });
      if (!res.ok) throw new Error("Falha ao gerar resumo semanal");
      const data = await res.json();
      setSummary(data.summary);
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setSummaryLoading(false);
    }
  }

  const totalFocusHours = metrics.reduce((sum, m) => sum + (m.fields.FocusHours || 0), 0);
  const totalTasksCompleted = metrics.reduce((sum, m) => sum + (m.fields.TasksCompleted || 0), 0);
  const totalInterruptions = metrics.reduce((sum, m) => sum + (m.fields.Interruptions || 0), 0);
  const avgEnergy =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + (m.fields.Energy || 0), 0) / metrics.length
      : 0;

  const maxFocusHours = Math.max(1, ...metrics.map((m) => m.fields.FocusHours || 0));

  const stats = [
    { label: "Horas de foco (7d)", value: totalFocusHours.toFixed(1) },
    { label: "Tarefas concluídas (7d)", value: totalTasksCompleted },
    { label: "Interrupções (7d)", value: totalInterruptions },
    { label: "Energia média", value: avgEnergy.toFixed(1) },
  ];

  return (
    <section className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-4 lg:col-span-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        {loading && <span className="text-xs text-neutral-500">Carregando…</span>}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 p-3"
            >
              <p className="text-xs text-neutral-500">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && metrics.length === 0 && (
        <p className="text-sm text-neutral-500">Nenhuma métrica registrada ainda.</p>
      )}

      {metrics.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Horas de foco por dia
          </h3>
          <svg viewBox={`0 0 ${metrics.length * 40} 120`} className="w-full h-32">
            {metrics.map((m, i) => {
              const hours = m.fields.FocusHours || 0;
              const barHeight = (hours / maxFocusHours) * 100;
              const x = i * 40 + 8;
              const key = m.id;
              return (
                <g
                  key={key}
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered((h) => (h === key ? null : h))}
                >
                  <rect
                    x={x}
                    y={110 - barHeight}
                    width={24}
                    height={barHeight}
                    rx={3}
                    className={hovered === key ? "fill-blue-600" : "fill-blue-400"}
                  />
                  <text x={x + 12} y={118} textAnchor="middle" className="fill-neutral-500 text-[8px]">
                    {formatDay(m.fields.Date)}
                  </text>
                  {hovered === key && (
                    <text
                      x={x + 12}
                      y={100 - barHeight}
                      textAnchor="middle"
                      className="fill-neutral-900 dark:fill-neutral-100 text-[9px] font-semibold"
                    >
                      {hours}h
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      <div id="weekly-summary-slot" className="flex flex-col gap-2 border-t border-black/10 dark:border-white/10 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Resumo semanal (IA)
          </h3>
          <button
            onClick={generateWeeklySummary}
            disabled={summaryLoading}
            className="rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {summaryLoading ? "Gerando…" : "Gerar resumo da semana"}
          </button>
        </div>
        {summary && (
          <p className="text-sm whitespace-pre-wrap rounded-md bg-neutral-50 dark:bg-neutral-800 p-3">
            {summary}
          </p>
        )}
        {!summary && !summaryLoading && (
          <p className="text-sm text-neutral-500">
            Clique em &quot;Gerar resumo da semana&quot; para uma síntese com sugestões de prioridades.
          </p>
        )}
      </div>
    </section>
  );
}
