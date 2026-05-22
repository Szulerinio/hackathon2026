import { prisma } from "../../prisma";
import { writeAiLog } from "../logging";
import {
  GET_LISTING_DESCRIPTIONS_INPUT_SCHEMA,
  GET_LISTING_DESCRIPTIONS_STATUSES,
  type GetListingDescriptionsStatus,
} from "./get-listing-descriptions-schema";
import type { CrmAiTool, ToolHandlerResult } from "./types";

const MAX_LISTINGS = 200;

export type GetListingDescriptionsToolInput = {
  status?: GetListingDescriptionsStatus;
};

export type ListingDescriptionRow = {
  id: number;
  address: string;
  title: string;
  description: string;
  valueDisplay: string;
  status: string;
  sellerSlug: string;
  sellerName: string;
  existingBuyerSlugs: string[];
};

function readStatus(
  obj: Record<string, unknown>,
): GetListingDescriptionsStatus | undefined {
  const value = obj.status;
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new Error('"status" must be a string.');
  }
  const trimmed = value.trim();
  if (
    !(GET_LISTING_DESCRIPTIONS_STATUSES as readonly string[]).includes(trimmed)
  ) {
    throw new Error(
      `"status" must be one of: ${GET_LISTING_DESCRIPTIONS_STATUSES.join(", ")}.`,
    );
  }
  return trimmed as GetListingDescriptionsStatus;
}

export function parseGetListingDescriptionsToolInput(
  raw: unknown,
): GetListingDescriptionsToolInput {
  if (raw === undefined || raw === null) {
    return {};
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Tool input must be a JSON object.");
  }
  const obj = raw as Record<string, unknown>;
  const status = readStatus(obj);
  if (Object.keys(obj).length > 0 && status === undefined && "status" in obj) {
    throw new Error('"status" cannot be empty.');
  }
  const extra = Object.keys(obj).filter((k) => k !== "status");
  if (extra.length > 0) {
    throw new Error(`Unknown field(s): ${extra.join(", ")}.`);
  }
  return status ? { status } : {};
}

export async function fetchListingDescriptions(
  input: GetListingDescriptionsToolInput = {},
): Promise<ListingDescriptionRow[]> {
  const statusFilter = input.status ?? "active";

  const rows = await prisma.listing.findMany({
    where: { status: statusFilter },
    include: {
      owner: { select: { slug: true, name: true } },
      deals: {
        where: { buyerId: { not: null } },
        select: { buyer: { select: { slug: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: MAX_LISTINGS,
  });

  return rows.map((row) => {
    const slugs = new Set<string>();
    for (const deal of row.deals) {
      const slug = deal.buyer?.slug;
      if (slug) slugs.add(slug);
    }
    return {
      id: row.id,
      address: row.address?.trim() ?? "",
      title: row.title.trim(),
      description: row.description?.trim() ?? "",
      valueDisplay: row.valueDisplay?.trim() ?? "",
      status: row.status,
      sellerSlug: row.owner.slug,
      sellerName: row.owner.name,
      existingBuyerSlugs: [...slugs].sort(),
    };
  });
}

export const getListingDescriptionsTool: CrmAiTool = {
  definition: {
    name: "get_listing_descriptions",
    strict: true,
    description: `Load CRM listings for buyer–listing matching (descriptions, addresses, prices, existing deals).

Call once at the start of contact→listing matching. Default returns active listings only (up to ${MAX_LISTINGS}).`,
    input_schema: {
      ...GET_LISTING_DESCRIPTIONS_INPUT_SCHEMA,
      required: [...GET_LISTING_DESCRIPTIONS_INPUT_SCHEMA.required],
    },
  },
  parseInput: parseGetListingDescriptionsToolInput,
  async run(input: unknown): Promise<ToolHandlerResult> {
    try {
      const parsed = parseGetListingDescriptionsToolInput(input);
      const listings = await fetchListingDescriptions(parsed);
      const statusFilter = parsed.status ?? "active";

      await writeAiLog({
        operation: "get_listing_descriptions",
        status: "info",
        summary: `Returned ${listings.length} listing(s) (status=${statusFilter}).`,
        payload: {
          count: listings.length,
          statusFilter,
          cappedAt: MAX_LISTINGS,
        },
      });

      return {
        content: JSON.stringify({
          ok: true,
          count: listings.length,
          statusFilter,
          listings,
        }),
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load listing descriptions.";
      return {
        content: JSON.stringify({ ok: false, error: message }),
        is_error: true,
      };
    }
  },
};
