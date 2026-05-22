import { formatDate, getCrmToday } from "../../decay";
import { createDeal } from "../../deals-mutations";
import { prisma } from "../../prisma";
import { writeAiLog } from "../logging";
import { CREATE_POTENTIAL_DEAL_INPUT_SCHEMA } from "./create-potential-deal-schema";
import type { CrmAiTool, ToolHandlerResult } from "./types";

export type CreatePotentialDealToolInput = {
  buyerSlug: string;
  listingId: number;
  matchReason: string;
};

function readString(
  obj: Record<string, unknown>,
  key: string,
  opts: { required?: boolean; maxLength?: number } = {},
): string | undefined {
  const value = obj[key];
  if (value === undefined || value === null) {
    if (opts.required) throw new Error(`"${key}" is required.`);
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error(`"${key}" must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed && opts.required) {
    throw new Error(`"${key}" cannot be empty.`);
  }
  if (opts.maxLength && trimmed.length > opts.maxLength) {
    throw new Error(`"${key}" must be at most ${opts.maxLength} characters.`);
  }
  return trimmed || undefined;
}

function readListingId(obj: Record<string, unknown>): number {
  const value = obj.listingId;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error('"listingId" must be a positive integer.');
  }
  return value;
}

export function parseCreatePotentialDealToolInput(
  raw: unknown,
): CreatePotentialDealToolInput {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Tool input must be a JSON object.");
  }
  const obj = raw as Record<string, unknown>;

  return {
    buyerSlug: readString(obj, "buyerSlug", { required: true })!,
    listingId: readListingId(obj),
    matchReason: readString(obj, "matchReason", {
      required: true,
      maxLength: 1000,
    })!,
  };
}

export async function createPotentialDealFromMatch(
  input: CreatePotentialDealToolInput,
): Promise<{
  id: number;
  buyerSlug: string;
  buyerName: string;
  listingId: number;
  created: boolean;
  message: string;
}> {
  const buyer = await prisma.contact.findUnique({
    where: { slug: input.buyerSlug },
    select: { id: true, slug: true, name: true },
  });
  if (!buyer) {
    throw new Error(`Buyer contact not found: ${input.buyerSlug}`);
  }

  const listing = await prisma.listing.findUnique({
    where: { id: input.listingId },
    select: {
      id: true,
      address: true,
      title: true,
      valueDisplay: true,
      ownerId: true,
    },
  });
  if (!listing) {
    throw new Error(`Listing not found: ${input.listingId}`);
  }

  if (listing.ownerId === buyer.id) {
    throw new Error("Cannot create a deal: contact owns this listing.");
  }

  const existing = await prisma.deal.findFirst({
    where: { buyerId: buyer.id, listingId: listing.id },
    select: { id: true, status: true },
  });

  if (existing) {
    const message = `Deal #${existing.id} already exists (${existing.status}) for ${buyer.name} — skipped.`;
    await writeAiLog({
      operation: "create_potential_deal",
      status: "info",
      contactSlug: buyer.slug,
      listingId: listing.id,
      summary: message,
      payload: {
        listingId: listing.id,
        dealId: existing.id,
        created: false,
        matchReason: input.matchReason,
      },
    });
    return {
      id: existing.id,
      buyerSlug: buyer.slug,
      buyerName: buyer.name,
      listingId: listing.id,
      created: false,
      message,
    };
  }

  const today = formatDate(getCrmToday());
  const { id, buyerSlug } = await createDeal({
    buyerSlug: input.buyerSlug,
    listingId: input.listingId,
    status: "potential",
    value: listing.valueDisplay ?? "",
    lastActivityDate: today,
  });

  const message = `Potential deal #${id} created for ${buyer.name}.`;
  await writeAiLog({
    operation: "create_potential_deal",
    status: "success",
    contactSlug: buyer.slug,
    listingId: listing.id,
    summary: message,
    payload: {
      listingId: listing.id,
      dealId: id,
      created: true,
      matchReason: input.matchReason,
    },
  });

  return {
    id,
    buyerSlug,
    buyerName: buyer.name,
    listingId: listing.id,
    created: true,
    message,
  };
}

export const createPotentialDealTool: CrmAiTool = {
  definition: {
    name: "create_potential_deal",
    strict: true,
    description: `Create one CRM deal with status "potential" when a buyer's notes clearly overlap a listing.

Call once per distinct buyer–listing match. Do not call if overlap is weak or speculative.`,
    input_schema: {
      ...CREATE_POTENTIAL_DEAL_INPUT_SCHEMA,
      required: [...CREATE_POTENTIAL_DEAL_INPUT_SCHEMA.required],
    },
  },
  parseInput: parseCreatePotentialDealToolInput,
  async run(input: unknown): Promise<ToolHandlerResult> {
    try {
      const parsed = parseCreatePotentialDealToolInput(input);
      const result = await createPotentialDealFromMatch(parsed);
      return {
        content: JSON.stringify({
          ok: true,
          ...result,
          matchReason: parsed.matchReason,
        }),
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create potential deal.";
      return {
        content: JSON.stringify({ ok: false, error: message }),
        is_error: true,
      };
    }
  },
};
