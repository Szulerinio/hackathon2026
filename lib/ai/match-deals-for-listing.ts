import { getClaudeConfig, hasClaudeApiKey } from "../claude/config";
import { prisma } from "../prisma";
import { runClaudeToolLoop, type ClaudeApiMessage } from "./claude-tool-loop";
import { writeAiLog } from "./logging";
import { CRM_AI_TOOL_DEFINITIONS } from "./tools/registry";

export type CreatedPotentialDealSummary = {
  dealId: number;
  buyerSlug: string;
  buyerName: string;
  listingId: number;
  created: boolean;
};

export type MatchDealsForListingInput = {
  listingId: number;
  /** e.g. listing_create, listing_edit */
  source?: string;
};

export type MatchDealsForListingResult = {
  created: CreatedPotentialDealSummary[];
  summary: string;
  iterations: number;
  skipped?: boolean;
  skipReason?: string;
};

const MATCH_LISTING_TOOLS = ["get_client_notes", "create_potential_deal"]
  .map((name) => CRM_AI_TOOL_DEFINITIONS.find((t) => t.name === name))
  .filter((t): t is (typeof CRM_AI_TOOL_DEFINITIONS)[number] => t !== undefined);

function buildSystemPrompt(sellerSlug: string): string {
  return `You are an assistant for Rafał, a real estate agent using a personal CRM.

Your job: match ONE listing to buyer contacts whose notes/context clearly fit that property.

Workflow:
1. First call get_client_notes (no arguments) to load all contacts with notes/context and their existing deal listing IDs.
2. Pick at most 5 strong buyer matches for the listing in the user message.
3. For each strong match, call create_potential_deal once with buyerSlug, listingId (from the user message), and matchReason (1–3 sentences citing overlap from buyer notes/context and listing details).

Rules:
- Only match buyers with clear overlap — budget, area, property type, timeline, family needs, etc.
- Skip weak or speculative pairs.
- Never match the listing seller as buyer (seller slug: ${sellerSlug}).
- Skip buyers who already have a deal on this listing (see existingDealListingIds).
- Do not create more than 5 potential deals.
- If no strong matches, do not call create_potential_deal; reply briefly why.`;
}

function buildUserMessage(listing: {
  id: number;
  address: string | null;
  title: string;
  description: string | null;
  valueDisplay: string | null;
  status: string;
  sellerSlug: string;
}): string {
  const address = listing.address?.trim() || listing.title;
  const description = listing.description?.trim() || "(no description)";
  const value = listing.valueDisplay?.trim() || "(not set)";

  return `Match buyers to this listing:

- id: ${listing.id}
- address: ${address}
- description: ${description}
- valueDisplay: ${value}
- status: ${listing.status}
- sellerSlug: ${listing.sellerSlug}

Use listing id ${listing.id} in every create_potential_deal call.`;
}

function parseCreatedFromMessages(
  messages: ClaudeApiMessage[],
): CreatedPotentialDealSummary[] {
  const created: CreatedPotentialDealSummary[] = [];

  for (const msg of messages) {
    if (!Array.isArray(msg.content)) continue;
    for (const block of msg.content) {
      if (block.type !== "tool_result") continue;
      try {
        const parsed = JSON.parse(block.content) as {
          ok?: boolean;
          id?: number;
          buyerSlug?: string;
          buyerName?: string;
          listingId?: number;
          created?: boolean;
        };
        if (
          parsed.ok &&
          parsed.id &&
          parsed.buyerSlug &&
          parsed.listingId !== undefined
        ) {
          created.push({
            dealId: parsed.id,
            buyerSlug: parsed.buyerSlug,
            buyerName: parsed.buyerName ?? parsed.buyerSlug,
            listingId: parsed.listingId,
            created: parsed.created === true,
          });
        }
      } catch {
        /* ignore */
      }
    }
  }

  return created;
}

export async function matchDealsForListing(
  input: MatchDealsForListingInput,
): Promise<MatchDealsForListingResult> {
  const source = input.source?.trim() || "match_deals_listing";
  const listingId = input.listingId;

  if (!hasClaudeApiKey()) {
    const skipReason = "AI is not configured (ANTHROPIC_API_KEY missing).";
    await writeAiLog({
      operation: "match_deals_listing",
      status: "info",
      source,
      listingId,
      summary: "Skipped — no API key",
      payload: { listingId, skipped: true, reason: skipReason },
    });
    return {
      created: [],
      summary: skipReason,
      iterations: 0,
      skipped: true,
      skipReason,
    };
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      address: true,
      description: true,
      valueDisplay: true,
      status: true,
      owner: { select: { slug: true } },
    },
  });

  if (!listing) {
    const skipReason = `Listing not found: ${listingId}`;
    await writeAiLog({
      operation: "match_deals_listing",
      status: "info",
      source,
      listingId,
      summary: "Skipped — listing missing",
      payload: { listingId, skipped: true, reason: skipReason },
    });
    return {
      created: [],
      summary: skipReason,
      iterations: 0,
      skipped: true,
      skipReason,
    };
  }

  if (listing.status === "withdrawn") {
    const skipReason = "Listing is withdrawn — matching skipped.";
    await writeAiLog({
      operation: "match_deals_listing",
      status: "info",
      source,
      listingId,
      summary: skipReason,
      payload: { listingId, skipped: true, reason: skipReason },
    });
    return {
      created: [],
      summary: skipReason,
      iterations: 0,
      skipped: true,
      skipReason,
    };
  }

  const { cheapModel } = getClaudeConfig();
  const started = Date.now();
  const sellerSlug = listing.owner.slug;

  await writeAiLog({
    operation: "match_deals_listing",
    status: "info",
    source,
    listingId,
    model: cheapModel,
    summary: "Started listing → buyer deal matching",
    inputPreview: buildUserMessage({ ...listing, sellerSlug }),
  });

  try {
    const { finalText, iterations, messages } = await runClaudeToolLoop({
      system: buildSystemPrompt(sellerSlug),
      messages: [
        {
          role: "user",
          content: buildUserMessage({ ...listing, sellerSlug }),
        },
      ],
      tools: MATCH_LISTING_TOOLS,
      model: cheapModel,
      max_tokens: 2048,
      temperature: 0,
      maxIterations: 10,
      logContext: { source, listingId },
    });

    const allResults = parseCreatedFromMessages(messages);
    const newlyCreated = allResults.filter((d) => d.created);
    const summary =
      newlyCreated.length > 0
        ? `Created ${newlyCreated.length} potential deal${newlyCreated.length === 1 ? "" : "s"}.`
        : finalText || "No new potential deals created.";

    await writeAiLog({
      operation: "match_deals_listing",
      status: "success",
      source,
      listingId,
      model: cheapModel,
      summary,
      inputPreview: buildUserMessage({ ...listing, sellerSlug }),
      durationMs: Date.now() - started,
      payload: {
        iterations,
        deals: allResults,
        newly_created: newlyCreated,
        final_text_preview: finalText.slice(0, 500),
      },
    });

    return { created: allResults, summary, iterations };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Listing deal match failed";
    await writeAiLog({
      operation: "match_deals_listing",
      status: "error",
      source,
      listingId,
      model: cheapModel,
      summary: "Listing deal matching failed",
      error: message,
      durationMs: Date.now() - started,
      payload: { listingId },
    });
    throw err;
  }
}
