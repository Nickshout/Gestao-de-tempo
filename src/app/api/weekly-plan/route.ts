import { NextRequest, NextResponse } from "next/server";
import { createRecord, listRecords } from "@/lib/airtable";

const TABLE = "WeeklyPlan";

export type WeeklyPlanDay = "Seg" | "Ter" | "Qua" | "Qui" | "Sex" | "Sáb" | "Dom";
export type WeeklyPlanBlock = "Foco" | "Reunião" | "Admin" | "Descanso";

export interface WeeklyPlanFields {
  Day: WeeklyPlanDay;
  Block: WeeklyPlanBlock;
  Label: string;
}

export async function GET() {
  try {
    const records = await listRecords<WeeklyPlanFields>(TABLE);
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: WeeklyPlanFields = await request.json();
    const record = await createRecord<WeeklyPlanFields>(TABLE, body);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
