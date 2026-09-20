import { NextRequest, NextResponse } from "next/server";
import { createRecord, listRecords } from "@/lib/airtable";

const TABLE = "Commitments";

export type CommitmentType = "Reunião" | "Entrega" | "Pessoal" | "Outro";

export interface CommitmentFields {
  Title: string;
  Date: string;
  Time: string;
  Type: CommitmentType;
  With?: string;
}

export async function GET() {
  try {
    const records = await listRecords<CommitmentFields>(TABLE, {
      sort: [{ field: "Date", direction: "asc" }],
    });
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CommitmentFields = await request.json();
    const record = await createRecord<CommitmentFields>(TABLE, body);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
