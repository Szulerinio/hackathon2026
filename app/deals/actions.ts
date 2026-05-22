"use server";

import { revalidatePath } from "next/cache";
import { createDeal, updateDeal } from "../../lib/deals-mutations";

export type CreateDealResult =
  | { ok: true; id: number }
  | { ok: false; error: string };

export type UpdateDealResult = CreateDealResult;

const DEAL_STATUSES = ["viewing", "offer", "negotiation", "closed"] as const;

function parseDealInput(
  formData: FormData,
): { ok: true; input: Parameters<typeof createDeal>[0] } | { ok: false; error: string } {
  const buyerSlug = String(formData.get("buyerSlug") ?? "").trim();
  if (!buyerSlug) {
    return { ok: false, error: "Select a buyer." };
  }

  const listingIdRaw = String(formData.get("listingId") ?? "").trim();
  const listingId = Number.parseInt(listingIdRaw, 10);
  if (Number.isNaN(listingId) || listingId < 1) {
    return { ok: false, error: "Select a property." };
  }

  const status = String(formData.get("status") ?? "viewing").trim();
  if (!DEAL_STATUSES.includes(status as (typeof DEAL_STATUSES)[number])) {
    return { ok: false, error: "Invalid deal status." };
  }

  const lastActivityDate = String(formData.get("lastActivityDate") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastActivityDate)) {
    return { ok: false, error: "Last activity date is required." };
  }

  return {
    ok: true,
    input: {
      buyerSlug,
      listingId,
      status,
      value: String(formData.get("value") ?? ""),
      lastActivityDate,
    },
  };
}

function revalidateDealPaths(...buyerSlugs: string[]) {
  revalidatePath("/deals");
  revalidatePath("/");
  for (const slug of new Set(buyerSlugs.filter(Boolean))) {
    revalidatePath(`/contacts/${slug}`);
  }
}

export async function createDealAction(
  formData: FormData,
): Promise<CreateDealResult> {
  const parsed = parseDealInput(formData);
  if (!parsed.ok) return parsed;

  try {
    const { id, buyerSlug } = await createDeal(parsed.input);
    revalidateDealPaths(buyerSlug);
    return { ok: true, id };
  } catch (err) {
    console.error("createDeal failed:", err);
    const message =
      err instanceof Error
        ? err.message === "Buyer contact not found."
          ? "Selected buyer was not found."
          : err.message === "Listing not found."
            ? "Selected property was not found."
            : "Could not save deal. Try again."
        : "Could not save deal. Try again.";
    return { ok: false, error: message };
  }
}

export async function updateDealAction(
  formData: FormData,
): Promise<UpdateDealResult> {
  const idRaw = String(formData.get("id") ?? "").trim();
  const id = Number.parseInt(idRaw, 10);
  if (Number.isNaN(id) || id < 1) {
    return { ok: false, error: "Missing deal." };
  }

  const parsed = parseDealInput(formData);
  if (!parsed.ok) return parsed;

  try {
    const result = await updateDeal({ id, ...parsed.input });
    revalidateDealPaths(result.previousBuyerSlug, result.buyerSlug);
    return { ok: true, id: result.id };
  } catch (err) {
    console.error("updateDeal failed:", err);
    let message = "Could not update deal. Try again.";
    if (err instanceof Error) {
      if (err.message === "Deal not found.") {
        message = "Deal was not found.";
      } else if (err.message === "Buyer contact not found.") {
        message = "Selected buyer was not found.";
      } else if (err.message === "Listing not found.") {
        message = "Selected property was not found.";
      }
    }
    return { ok: false, error: message };
  }
}
