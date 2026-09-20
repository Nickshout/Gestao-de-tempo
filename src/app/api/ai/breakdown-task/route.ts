import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { createRecord } from "@/lib/airtable";

interface AIInsightFields {
  Input: string;
  Type: "Priorização" | "Desdobramento" | "Resumo Semanal";
  Output: string;
  Date: string;
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

function fallbackParseList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^[\s\-*\d.)]+/, "").trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const { title }: { title: string } = await request.json();
    if (!title) {
      return NextResponse.json({ error: "title é obrigatório" }, { status: 400 });
    }

    const prompt = `Você é um assistente de produtividade que aplica o método EDA
(Esclarecer → Desdobrar → Agir) para quebrar tarefas em passos executáveis.

Tarefa: ${title}

Aplique o método EDA e gere de 4 a 6 subtarefas curtas e executáveis.
Responda APENAS com um JSON válido no formato:
{"subtasks": ["subtarefa 1", "subtarefa 2", "..."]}`;

    const raw = await callGemini(prompt);

    let subtasks: string[] = [];
    try {
      const parsed = extractJson(raw) as { subtasks?: string[] };
      if (Array.isArray(parsed.subtasks)) subtasks = parsed.subtasks;
    } catch {
      subtasks = fallbackParseList(raw);
    }

    await createRecord<AIInsightFields>("AIInsights", {
      Input: title,
      Type: "Desdobramento",
      Output: subtasks.join("; "),
      Date: new Date().toISOString().slice(0, 10),
    });

    return NextResponse.json({ subtasks });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
