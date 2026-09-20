import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { createRecord, listRecords } from "@/lib/airtable";
import type { TaskFields } from "@/app/api/tasks/route";
import type { HabitFields } from "@/app/api/habits/route";
import type { MetricsFields } from "@/app/api/metrics/route";

interface AIInsightFields {
  Input: string;
  Type: "Priorização" | "Desdobramento" | "Resumo Semanal";
  Output: string;
  Date: string;
}

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

export async function POST() {
  try {
    const [tasks, habits, metrics] = await Promise.all([
      listRecords<TaskFields>("Tasks"),
      listRecords<HabitFields>("Habits"),
      listRecords<MetricsFields>("Metrics"),
    ]);

    const last7Days = new Set(lastNDays(7));

    const statusCounts = tasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.fields.Status] = (acc[t.fields.Status] || 0) + 1;
      return acc;
    }, {});

    const recentHabits = habits.filter((h) => last7Days.has(h.fields.Date));
    const habitDoneCount = recentHabits.filter((h) => h.fields.Done).length;

    const recentMetrics = metrics.filter((m) => last7Days.has(m.fields.Date));
    const totalFocusHours = recentMetrics.reduce((sum, m) => sum + (m.fields.FocusHours || 0), 0);
    const totalInterruptions = recentMetrics.reduce((sum, m) => sum + (m.fields.Interruptions || 0), 0);
    const avgEnergy =
      recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + (m.fields.Energy || 0), 0) / recentMetrics.length
        : 0;

    const dataSummary = {
      tasks: statusCounts,
      habits: { registrosNaSemana: recentHabits.length, concluidos: habitDoneCount },
      metrics: {
        horasDeFoco: totalFocusHours,
        interrupcoes: totalInterruptions,
        energiaMedia: Number(avgEnergy.toFixed(1)),
      },
    };

    const prompt = `Você é um assistente de produtividade pessoal. Com base nos dados da
última semana abaixo, escreva um resumo curto (3-4 frases) do desempenho e sugira
prioridades para a próxima semana.

Dados da semana (JSON):
${JSON.stringify(dataSummary, null, 2)}

Responda em texto corrido, sem markdown, em português.`;

    const summary = await callGemini(prompt);

    await createRecord<AIInsightFields>("AIInsights", {
      Input: JSON.stringify(dataSummary),
      Type: "Resumo Semanal",
      Output: summary,
      Date: toISODate(new Date()),
    });

    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
