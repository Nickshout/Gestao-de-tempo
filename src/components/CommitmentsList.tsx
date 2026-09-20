"use client";

import { useEffect, useState } from "react";
import type { AirtableRecord } from "@/lib/airtable";
import type { CommitmentFields, CommitmentType } from "@/app/api/commitments/route";
import { useToast } from "@/components/ToastProvider";
import Skeleton from "@/components/Skeleton";

const TYPE_STYLES: Record<CommitmentType, string> = {
  Reunião: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Entrega: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Pessoal: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Outro: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

type Commitment = AirtableRecord<CommitmentFields>;

function formatDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

export default function CommitmentsList() {
  const { showToast } = useToast();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/commitments", { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao carregar compromissos");
        setCommitments(await res.json());
      } catch (e) {
        showToast((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const grouped = commitments.reduce<Record<string, Commitment[]>>((acc, c) => {
    const key = c.fields.Date;
    (acc[key] ??= []).push(c);
    return acc;
  }, {});

  const orderedDates = Object.keys(grouped).sort();

  return (
    <section className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Compromissos</h2>
        {loading && <span className="text-xs text-neutral-500">Carregando…</span>}
      </div>

      {loading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!loading && orderedDates.length === 0 && (
        <p className="text-sm text-neutral-500">Nenhum compromisso próximo.</p>
      )}

      <div className="flex flex-col gap-4">
        {!loading && orderedDates.map((date) => (
          <div key={date} className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {formatDate(date)}
            </h3>
            <div className="flex flex-col gap-2">
              {grouped[date].map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-md border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{c.fields.Title}</span>
                    {c.fields.With && (
                      <span className="text-xs text-neutral-500">com {c.fields.With}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">{c.fields.Time}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_STYLES[c.fields.Type]}`}
                    >
                      {c.fields.Type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
