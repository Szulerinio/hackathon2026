import {
  matchDealsForContactAction,
  matchDealsForListingAction,
} from "../../app/deals/match-actions";

export type DealMatchMeta = {
  dealsCreated?: number;
  dealMatchSummary?: string;
  dealMatchError?: string;
};

export async function runDealMatchForListing(
  listingId: number,
  source: string,
): Promise<DealMatchMeta> {
  const ai = await matchDealsForListingAction(listingId, source);
  if (ai.ok) {
    const dealsCreated = ai.created.filter((d) => d.created).length;
    return {
      dealsCreated,
      dealMatchSummary: ai.summary,
    };
  }
  return { dealMatchError: ai.error };
}

export async function runDealMatchForContact(
  contactSlug: string,
  source: string,
): Promise<DealMatchMeta> {
  const ai = await matchDealsForContactAction(contactSlug, source);
  if (ai.ok) {
    const dealsCreated = ai.created.filter((d) => d.created).length;
    return {
      dealsCreated,
      dealMatchSummary: ai.summary,
    };
  }
  return { dealMatchError: ai.error };
}
