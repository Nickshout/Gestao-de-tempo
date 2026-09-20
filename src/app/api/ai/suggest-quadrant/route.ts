import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { createRecord } from "@/lib/airtable";
import type { TaskQuadrant } from "@/app/api/tasks/route";

interface AIInsightFields {
  Input: string;
  Type: "Priorização" | "Desdobramento" | "Resumo Semanal";
  Output: string;
  Date: string;
}

const VALID_QUADRANTS: TaskQuadrant[] = ["Q1", "Q2", "Q3", "Q4"];

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function POST(request: NextRequest) {
  try {
    const { title, notes }: { title: string; notes?: string } = await request.json();
    if (!title) {
      return NextResponse.json({ error: "title é obrigatório" }, { status: 400 });
    }

    const prompt = `Você é um assistente de produtividade especialista na Matriz de Eisenhower.
Classifique a tarefa abaixo em um dos quadrantes:
Q1 = Urgente e Importante (faça agora)
Q2 = Importante, não urgente (planeje)
Q3 = Urgente, não importante (delegue)
Q4 = Nem urgente, nem importante (elimine)

Título: ${title}
Notas: ${notes || "(sem notas)"}

Responda APENAS com um JSON válido no formato:
{"quadrant": "Q1", "justification": "justificativa curta em uma frase"}`;

    const raw = await callGemini(prompt);

    let quadrant: TaskQuadrant = "Q3";
    let justification = raw;
    try {
      const parsed = extractJson(raw) as { quadrant?: string; justification?: string };
      if (parsed.quadrant && VALID_QUADRANTS.includes(parsed.quadrant as TaskQuadrant)) {
        quadrant = parsed.quadrant as TaskQuadrant;
      }
      if (parsed.justification) justification = parsed.justification;
    } catch {
      const match = raw.match(/Q[1-4]/);
      if (match) quadrant = match[0] as TaskQuadrant;
    }

    await createRecord<AIInsightFields>("AIInsights", {
      Input: `${title}${notes ? ` — ${notes}` : ""}`,
      Type: "Priorização",
      Output: `${quadrant}: ${justification}`,
      Date: new Date().toISOString().slice(0, 10),
    });

    return NextResponse.json({ quadrant, justification });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
