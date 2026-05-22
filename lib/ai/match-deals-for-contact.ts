import { getClaudeConfig, hasClaudeApiKey } from "../claude/config";
import { prisma } from "../prisma";
import { runClaudeToolLoop, type ClaudeApiMessage } from "./claude-tool-loop";
import { writeAiLog } from "./logging";
import type { CreatedPotentialDealSummary } from "./match-deals-for-listing";
import { CRM_AI_TOOL_DEFINITIONS } from "./tools/registry";

export type MatchDealsForContactInput = {
  contactSlug: string;
  /** e.g. contact_create, contact_edit */
  source?: string;
};

export type MatchDealsForContactResult = {
  created: CreatedPotentialDealSummary[];
  summary: string;
  iterations: number;
  skipped?: boolean;
  skipReason?: string;
};

const MATCH_CONTACT_TOOLS = ["get_listing_descriptions", "create_potential_deal"]
  .map((name) => CRM_AI_TOOL_DEFINITIONS.find((t) => t.name === name))
  .filter((t): t is (typeof CRM_AI_TOOL_DEFINITIONS)[number] => t !== undefined);

function buildSystemPrompt(buyerSlug: string): string {
  return `You are an assistant for Rafał, a real estate agent using a personal CRM.

Your job: match ONE buyer contact (notes/context in the user message) to active listings that clearly fit their needs.

Workflow:
1. First call get_listing_descriptions (default active listings) to load listings with descriptions and existing buyer slugs per listing.
2. Pick at most 5 strong listing matches for this buyer.
3. For each strong match, call create_potential_deal once with buyerSlug "${buyerSlug}", listingId from the listing row, and matchReason (1–3 sentences citing overlap from contact notes/context and listing details).

Rules:
- Only match listings with clear overlap — budget, area, property type, timeline, family needs, etc.
- Skip weak or speculative pairs.
- Never match a listing where this contact is the seller (sellerSlug equals ${buyerSlug}).
- Skip listings where this buyer already has a deal (buyer slug in existingBuyerSlugs).
- Do not create more than 5 potential deals.
- If no strong matches, do not call create_potential_deal; reply briefly why.`;
}

function buildUserMessage(contact: {
  slug: string;
  name: string;
  context: string | null;
  notes: string | null;
}): string {
  const context = contact.context?.trim() || "(empty)";
  const notes = contact.notes?.trim() || "(empty)";

  return `Match listings to this buyer contact:

- slug: ${contact.slug}
- name: ${contact.name}
- context: ${context}
- notes: ${notes}

Use buyerSlug "${contact.slug}" in every create_potential_deal call.`;
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

export async function matchDealsForContact(
  input: MatchDealsForContactInput,
): Promise<MatchDealsForContactResult> {
  const source = input.source?.trim() || "match_deals_contact";
  const contactSlug = input.contactSlug.trim();

  if (!contactSlug) {
    const skipReason = "Contact slug is required.";
    return {
      created: [],
      summary: skipReason,
      iterations: 0,
      skipped: true,
      skipReason,
    };
  }

  if (!hasClaudeApiKey()) {
    const skipReason = "AI is not configured (ANTHROPIC_API_KEY missing).";
    await writeAiLog({
      operation: "match_deals_contact",
      status: "info",
      source,
      contactSlug,
      summary: "Skipped — no API key",
      payload: { contactSlug, skipped: true, reason: skipReason },
    });
    return {
      created: [],
      summary: skipReason,
      iterations: 0,
      skipped: true,
      skipReason,
    };
  }

  const contact = await prisma.contact.findUnique({
    where: { slug: contactSlug },
    select: {
      slug: true,
      name: true,
      context: true,
      notes: true,
    },
  });

  if (!contact) {
    const skipReason = `Contact not found: ${contactSlug}`;
    await writeAiLog({
      operation: "match_deals_contact",
      status: "info",
      source,
      contactSlug,
      summary: "Skipped — contact missing",
      payload: { contactSlug, skipped: true, reason: skipReason },
    });
    return {
      created: [],
      summary: skipReason,
      iterations: 0,
      skipped: true,
      skipReason,
    };
  }

  const context = contact.context?.trim() ?? "";
  const notes = contact.notes?.trim() ?? "";
  if (!context && !notes) {
    const skipReason = "Contact has no notes or context — matching skipped.";
    await writeAiLog({
      operation: "match_deals_contact",
      status: "info",
      source,
      contactSlug,
      summary: skipReason,
      payload: { contactSlug, skipped: true, reason: skipReason },
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
  const userMessage = buildUserMessage(contact);

  await writeAiLog({
    operation: "match_deals_contact",
    status: "info",
    source,
    contactSlug,
    model: cheapModel,
    summary: "Started contact → listing deal matching",
    inputPreview: userMessage,
  });

  try {
    const { finalText, iterations, messages } = await runClaudeToolLoop({
      system: buildSystemPrompt(contact.slug),
      messages: [{ role: "user", content: userMessage }],
      tools: MATCH_CONTACT_TOOLS,
      model: cheapModel,
      max_tokens: 2048,
      temperature: 0,
      maxIterations: 10,
      logContext: { source, contactSlug },
    });

    const allResults = parseCreatedFromMessages(messages);
    const newlyCreated = allResults.filter((d) => d.created);
    const summary =
      newlyCreated.length > 0
        ? `Created ${newlyCreated.length} potential deal${newlyCreated.length === 1 ? "" : "s"}.`
        : finalText || "No new potential deals created.";

    await writeAiLog({
      operation: "match_deals_contact",
      status: "success",
      source,
      contactSlug,
      model: cheapModel,
      summary,
      inputPreview: userMessage,
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
      err instanceof Error ? err.message : "Contact deal match failed";
    await writeAiLog({
      operation: "match_deals_contact",
      status: "error",
      source,
      contactSlug,
      model: cheapModel,
      summary: "Contact deal matching failed",
      error: message,
      durationMs: Date.now() - started,
      payload: { contactSlug },
    });
    throw err;
  }
}
