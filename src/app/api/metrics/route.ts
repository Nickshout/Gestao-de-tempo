import { NextRequest, NextResponse } from "next/server";
import { createRecord, listRecords } from "@/lib/airtable";

const TABLE = "Metrics";

export interface MetricsFields {
  Date: string;
  FocusHours: number;
  TasksCompleted: number;
  Interruptions: number;
  Energy: number;
}

export async function GET() {
  try {
    const records = await listRecords<MetricsFields>(TABLE, {
      sort: [{ field: "Date", direction: "asc" }],
    });
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: MetricsFields = await request.json();
    const record = await createRecord<MetricsFields>(TABLE, body);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
