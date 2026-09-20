import { NextResponse } from "next/server";
import { listRecords } from "@/lib/airtable";

export interface AIInsightFields {
  Input: string;
  Type: "Priorização" | "Desdobramento" | "Resumo Semanal";
  Output: string;
  Date: string;
}

export async function GET() {
  try {
    const records = await listRecords<AIInsightFields>("AIInsights");
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
