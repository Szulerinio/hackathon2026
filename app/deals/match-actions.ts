"use server";

import { revalidatePath } from "next/cache";
import {
  matchDealsForContact,
} from "../../lib/ai/match-deals-for-contact";
import {
  matchDealsForListing,
  type CreatedPotentialDealSummary,
} from "../../lib/ai/match-deals-for-listing";
import { ClaudeConfigError } from "../../lib/claude/config";
import { ClaudeApiError } from "../../lib/claude/client";
import { prisma } from "../../lib/prisma";

export type MatchDealsForListingActionResult =
  | {
      ok: true;
      created: CreatedPotentialDealSummary[];
      summary: string;
      skipped?: boolean;
    }
  | { ok: false; error: string };

export type MatchDealsForContactActionResult =
  | {
      ok: true;
      created: CreatedPotentialDealSummary[];
      summary: string;
      skipped?: boolean;
    }
  | { ok: false; error: string };

async function revalidateAfterContactDealMatch(
  contactSlug: string,
  listingIds: number[],
) {
  revalidatePath("/");
  revalidatePath("/deals");
  revalidatePath("/contacts");
  revalidatePath("/listings");
  revalidatePath("/ai/logs");
  revalidatePath(`/contacts/${contactSlug}`);

  const uniqueIds = [...new Set(listingIds.filter((id) => id > 0))];
  if (uniqueIds.length === 0) return;

  const listings = await prisma.listing.findMany({
    where: { id: { in: uniqueIds } },
    select: { owner: { select: { slug: true } } },
  });
  for (const listing of listings) {
    revalidatePath(`/contacts/${listing.owner.slug}`);
  }
}

function revalidateAfterDealMatch(
  listingId: number,
  buyerSlugs: string[],
  ownerSlug?: string,
) {
  revalidatePath("/");
  revalidatePath("/deals");
  revalidatePath("/listings");
  revalidatePath("/ai/logs");
  for (const slug of new Set([...buyerSlugs, ownerSlug].filter(Boolean))) {
    revalidatePath(`/contacts/${slug}`);
  }
}

export async function matchDealsForListingAction(
  listingId: number,
  source = "server_action",
): Promise<MatchDealsForListingActionResult> {
  if (!Number.isInteger(listingId) || listingId < 1) {
    return { ok: false, error: "Invalid listing id." };
  }

  try {
    const result = await matchDealsForListing({ listingId, source });

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { owner: { select: { slug: true } } },
    });

    revalidateAfterDealMatch(
      listingId,
      result.created.map((d) => d.buyerSlug),
      listing?.owner.slug,
    );

    return {
      ok: true,
      created: result.created,
      summary: result.summary,
      skipped: result.skipped,
    };
  } catch (err) {
    if (err instanceof ClaudeConfigError) {
      return {
        ok: false,
        error: "AI is not configured. Add ANTHROPIC_API_KEY to .env.",
      };
    }
    if (err instanceof ClaudeApiError) {
      console.error("matchDealsForListing Claude error:", err.message);
      return { ok: false, error: "AI request failed. Try again in a moment." };
    }
    if (err instanceof Error) {
      console.error("matchDealsForListing:", err.message);
      return { ok: false, error: err.message };
    }
    console.error("matchDealsForListing:", err);
    return { ok: false, error: "Could not match deals for listing. Try again." };
  }
}

export async function matchDealsForContactAction(
  contactSlug: string,
  source = "server_action",
): Promise<MatchDealsForContactActionResult> {
  const slug = contactSlug.trim();
  if (!slug) {
    return { ok: false, error: "Invalid contact slug." };
  }

  try {
    const result = await matchDealsForContact({ contactSlug: slug, source });

    await revalidateAfterContactDealMatch(
      slug,
      result.created.map((d) => d.listingId),
    );

    return {
      ok: true,
      created: result.created,
      summary: result.summary,
      skipped: result.skipped,
    };
  } catch (err) {
    if (err instanceof ClaudeConfigError) {
      return {
        ok: false,
        error: "AI is not configured. Add ANTHROPIC_API_KEY to .env.",
      };
    }
    if (err instanceof ClaudeApiError) {
      console.error("matchDealsForContact Claude error:", err.message);
      return { ok: false, error: "AI request failed. Try again in a moment." };
    }
    if (err instanceof Error) {
      console.error("matchDealsForContact:", err.message);
      return { ok: false, error: err.message };
    }
    console.error("matchDealsForContact:", err);
    return { ok: false, error: "Could not match deals for contact. Try again." };
  }
}
