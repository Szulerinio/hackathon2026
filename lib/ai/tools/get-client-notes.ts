import { prisma } from "../../prisma";
import { writeAiLog } from "../logging";
import { GET_CLIENT_NOTES_INPUT_SCHEMA } from "./get-client-notes-schema";
import type { CrmAiTool, ToolHandlerResult } from "./types";

const MAX_CONTACTS = 500;
const MAX_NOTES_PREVIEW = 500;

export type GetClientNotesToolInput = Record<string, never>;

export type ClientNotesRow = {
  slug: string;
  name: string;
  participantRole: string;
  context: string;
  notes: string;
  existingDealListingIds: number[];
};

export function parseGetClientNotesToolInput(
  raw: unknown,
): GetClientNotesToolInput {
  if (raw === undefined || raw === null) {
    return {};
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Tool input must be a JSON object.");
  }
  const obj = raw as Record<string, unknown>;
  if (Object.keys(obj).length > 0) {
    throw new Error(`Unknown field(s): ${Object.keys(obj).join(", ")}.`);
  }
  return {};
}

function trimPreview(text: string | null | undefined): string {
  const trimmed = text?.trim() ?? "";
  if (trimmed.length <= MAX_NOTES_PREVIEW) return trimmed;
  return `${trimmed.slice(0, MAX_NOTES_PREVIEW)}…`;
}

export async function fetchClientNotes(): Promise<ClientNotesRow[]> {
  const rows = await prisma.contact.findMany({
    select: {
      slug: true,
      name: true,
      participantRole: true,
      context: true,
      notes: true,
      buyerDeals: { select: { listingId: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: MAX_CONTACTS,
  });

  return rows.map((row) => {
    const listingIds = new Set<number>();
    for (const deal of row.buyerDeals) {
      listingIds.add(deal.listingId);
    }
    return {
      slug: row.slug,
      name: row.name,
      participantRole: row.participantRole?.trim() ?? "",
      context: row.context?.trim() ?? "",
      notes: row.notes?.trim() ?? "",
      existingDealListingIds: [...listingIds].sort((a, b) => a - b),
    };
  });
}

export const getClientNotesTool: CrmAiTool = {
  definition: {
    name: "get_client_notes",
    strict: true,
    description: `Load all CRM contacts with notes, context, and existing deal listing ids for listing→buyer matching.

Call once at the start of listing→buyer matching (up to ${MAX_CONTACTS} contacts, most recently updated first).`,
    input_schema: {
      ...GET_CLIENT_NOTES_INPUT_SCHEMA,
      required: [...GET_CLIENT_NOTES_INPUT_SCHEMA.required],
    },
  },
  parseInput: parseGetClientNotesToolInput,
  async run(input: unknown): Promise<ToolHandlerResult> {
    try {
      parseGetClientNotesToolInput(input);
      const contacts = await fetchClientNotes();

      const withNotes = contacts.filter(
        (c) => c.notes.length > 0 || c.context.length > 0,
      ).length;

      await writeAiLog({
        operation: "get_client_notes",
        status: "info",
        summary: `Returned ${contacts.length} contact(s) (${withNotes} with notes or context).`,
        payload: {
          count: contacts.length,
          withNotesOrContext: withNotes,
          cappedAt: MAX_CONTACTS,
        },
        inputPreview: JSON.stringify(
          contacts.slice(0, 5).map((c) => ({
            slug: c.slug,
            name: c.name,
            participantRole: c.participantRole,
            context: trimPreview(c.context),
            notes: trimPreview(c.notes),
            existingDealListingIds: c.existingDealListingIds,
          })),
        ),
      });

      return {
        content: JSON.stringify({
          ok: true,
          count: contacts.length,
          contacts,
        }),
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load client notes.";
      return {
        content: JSON.stringify({ ok: false, error: message }),
        is_error: true,
      };
    }
  },
};
