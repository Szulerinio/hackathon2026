import { prisma } from "../prisma";

export type AiLogStatus = "success" | "error" | "info";

export type WriteAiLogInput = {
  operation: string;
  status: AiLogStatus;
  source?: string;
  contactSlug?: string;
  model?: string;
  summary?: string;
  inputPreview?: string;
  payload?: unknown;
  error?: string;
  durationMs?: number;
};

const MAX_PREVIEW = 2000;
const MAX_PAYLOAD = 12000;

function truncate(value: string | undefined, max: number): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

function serializePayload(payload: unknown): string | null {
  if (payload === undefined || payload === null) return null;
  try {
    const json = JSON.stringify(payload, null, 0);
    return truncate(json, MAX_PAYLOAD);
  } catch {
    return truncate(String(payload), MAX_PAYLOAD);
  }
}

/** Persists one AI audit row. Never throws — failures go to console only. */
export async function writeAiLog(input: WriteAiLogInput): Promise<number | null> {
  try {
    const row = await prisma.aiLog.create({
      data: {
        operation: input.operation,
        status: input.status,
        source: input.source?.trim() || null,
        contactSlug: input.contactSlug?.trim() || null,
        model: input.model?.trim() || null,
        summary: truncate(input.summary, 500),
        inputPreview: truncate(input.inputPreview, MAX_PREVIEW),
        payload: serializePayload(input.payload),
        error: truncate(input.error, 2000),
        durationMs:
          input.durationMs !== undefined && Number.isFinite(input.durationMs)
            ? Math.max(0, Math.round(input.durationMs))
            : null,
      },
    });
    return row.id;
  } catch (err) {
    console.error("writeAiLog failed:", err);
    return null;
  }
}

export type AiLogEntry = {
  id: number;
  operation: string;
  status: AiLogStatus;
  source: string;
  contactSlug: string;
  model: string;
  summary: string;
  inputPreview: string;
  payload: string;
  error: string;
  durationMs: number | null;
  createdAt: string;
};

export async function getAiLogs(limit = 100): Promise<AiLogEntry[]> {
  const rows = await prisma.aiLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    operation: row.operation,
    status: row.status as AiLogStatus,
    source: row.source ?? "",
    contactSlug: row.contactSlug ?? "",
    model: row.model ?? "",
    summary: row.summary ?? "",
    inputPreview: row.inputPreview ?? "",
    payload: row.payload ?? "",
    error: row.error ?? "",
    durationMs: row.durationMs,
    createdAt: row.createdAt.toISOString().replace("T", " ").slice(0, 19),
  }));
}
