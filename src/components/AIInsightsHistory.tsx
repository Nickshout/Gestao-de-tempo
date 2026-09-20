"use client";

import { useEffect, useState } from "react";
import type { AirtableRecord } from "@/lib/airtable";
import { useToast } from "@/components/ToastProvider";
import Skeleton from "@/components/Skeleton";

type AIInsightType = "Priorização" | "Desdobramento" | "Resumo Semanal";

interface AIInsightFields {
  Input: string;
  Type: AIInsightType;
  Output: string;
  Date: string;
}

type AIInsight = AirtableRecord<AIInsightFields>;

const TYPE_STYLES: Record<AIInsightType, string> = {
  Priorização: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Desdobramento: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "Resumo Semanal": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default function AIInsightsHistory() {
  const { showToast } = useToast();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/ai-insights", { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao carregar histórico de IA");
        const all: AIInsight[] = await res.json();
        setInsights(
          [...all].sort((a, b) => (a.fields.Date < b.fields.Date ? 1 : -1)).slice(0, 10)
        );
      } catch (e) {
        showToast((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  return (
    <section className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-4 lg:col-span-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Histórico de IA</h2>
        {loading && <span className="text-xs text-neutral-500">Carregando…</span>}
      </div>

      {loading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {!loading && insights.length === 0 && (
        <p className="text-sm text-neutral-500">
          Nenhum registro ainda — use os botões de IA no Kanban ou no Dashboard.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {!loading && insights.map((insight) => (
          <div
            key={insight.id}
            className="rounded-md border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 p-3 text-sm flex flex-col gap-1"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_STYLES[insight.fields.Type]}`}
              >
                {insight.fields.Type}
              </span>
              <span className="text-xs text-neutral-500">{insight.fields.Date}</span>
            </div>
            <p className="text-xs text-neutral-500">
              <span className="font-medium">Entrada:</span> {truncate(insight.fields.Input, 120)}
            </p>
            <p className="text-xs">
              <span className="font-medium">Saída:</span> {truncate(insight.fields.Output, 200)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
