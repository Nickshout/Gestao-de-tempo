import { NextRequest, NextResponse } from "next/server";
import { createRecord, listRecords, updateRecord } from "@/lib/airtable";

const TABLE = "Habits";

export interface HabitFields {
  Name: string;
  Date: string;
  Done: boolean;
}

export async function GET() {
  try {
    const records = await listRecords<HabitFields>(TABLE);
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: HabitFields = await request.json();
    const record = await createRecord<HabitFields>(TABLE, body);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, fields }: { id: string; fields: Partial<HabitFields> } = await request.json();
    const record = await updateRecord<HabitFields>(TABLE, id, fields);
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
