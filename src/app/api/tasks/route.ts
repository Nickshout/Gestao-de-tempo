import { NextRequest, NextResponse } from "next/server";
import { createRecord, listRecords, updateRecord } from "@/lib/airtable";

const TABLE = "Tasks";

export type TaskStatus = "A Fazer" | "Em Andamento" | "Concluído";
export type TaskQuadrant = "Q1" | "Q2" | "Q3" | "Q4";

export interface TaskFields {
  Title: string;
  Notes?: string;
  Status: TaskStatus;
  Quadrant?: TaskQuadrant;
  DueDate?: string;
}

export async function GET() {
  try {
    const records = await listRecords<TaskFields>(TABLE);
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TaskFields = await request.json();
    const record = await createRecord<TaskFields>(TABLE, body);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, fields }: { id: string; fields: Partial<TaskFields> } = await request.json();
    const record = await updateRecord<TaskFields>(TABLE, id, fields);
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
