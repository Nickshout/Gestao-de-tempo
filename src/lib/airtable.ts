const AIRTABLE_API_URL = "https://api.airtable.com/v0";

function getBaseId(): string {
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!baseId) throw new Error("AIRTABLE_BASE_ID não configurado");
  return baseId;
}

function getHeaders(): HeadersInit {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error("AIRTABLE_TOKEN não configurado");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export interface AirtableRecord<TFields> {
  id: string;
  createdTime: string;
  fields: TFields;
}

interface ListRecordsResponse<TFields> {
  records: AirtableRecord<TFields>[];
  offset?: string;
}

export async function listRecords<TFields>(
  tableName: string,
  params?: { sort?: { field: string; direction: "asc" | "desc" }[] }
): Promise<AirtableRecord<TFields>[]> {
  const records: AirtableRecord<TFields>[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`${AIRTABLE_API_URL}/${getBaseId()}/${encodeURIComponent(tableName)}`);
    if (offset) url.searchParams.set("offset", offset);
    if (params?.sort) {
      params.sort.forEach((s, i) => {
        url.searchParams.set(`sort[${i}][field]`, s.field);
        url.searchParams.set(`sort[${i}][direction]`, s.direction);
      });
    }

    const res = await fetch(url.toString(), { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Airtable listRecords falhou (${tableName}): ${res.status} ${await res.text()}`);
    }
    const data: ListRecordsResponse<TFields> = await res.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

export async function createRecord<TFields extends object>(
  tableName: string,
  fields: TFields
): Promise<AirtableRecord<TFields>> {
  const res = await fetch(`${AIRTABLE_API_URL}/${getBaseId()}/${encodeURIComponent(tableName)}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    throw new Error(`Airtable createRecord falhou (${tableName}): ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function updateRecord<TFields extends object>(
  tableName: string,
  recordId: string,
  fields: Partial<TFields>
): Promise<AirtableRecord<TFields>> {
  const res = await fetch(`${AIRTABLE_API_URL}/${getBaseId()}/${encodeURIComponent(tableName)}/${recordId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    throw new Error(`Airtable updateRecord falhou (${tableName}): ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function deleteRecord(tableName: string, recordId: string): Promise<void> {
  const res = await fetch(`${AIRTABLE_API_URL}/${getBaseId()}/${encodeURIComponent(tableName)}/${recordId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Airtable deleteRecord falhou (${tableName}): ${res.status} ${await res.text()}`);
  }
}
