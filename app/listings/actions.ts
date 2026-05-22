"use server";

import { revalidatePath } from "next/cache";
import { createListing, updateListing } from "../../lib/listings-mutations";

export type CreateListingResult =
  | { ok: true; id: number }
  | { ok: false; error: string };

export type UpdateListingResult = CreateListingResult;

const LISTING_STATUSES = ["active", "sold", "withdrawn"] as const;

function parseListingInput(
  formData: FormData,
): { ok: true; input: Parameters<typeof createListing>[0] } | { ok: false; error: string } {
  const address = String(formData.get("address") ?? "").trim();
  if (address.length < 5) {
    return {
      ok: false,
      error: "Address is required (at least 5 characters).",
    };
  }

  const ownerSlug = String(formData.get("ownerSlug") ?? "").trim();
  if (!ownerSlug) {
    return { ok: false, error: "Select a seller." };
  }

  const status = String(formData.get("status") ?? "active").trim();
  if (!LISTING_STATUSES.includes(status as (typeof LISTING_STATUSES)[number])) {
    return { ok: false, error: "Invalid listing status." };
  }

  const daysRaw = String(formData.get("daysOnMarket") ?? "0").trim();
  const daysOnMarket = Number.parseInt(daysRaw, 10);
  if (Number.isNaN(daysOnMarket) || daysOnMarket < 0) {
    return { ok: false, error: "Days on market must be 0 or greater." };
  }

  return {
    ok: true,
    input: {
      address,
      price: String(formData.get("price") ?? ""),
      ownerSlug,
      status,
      daysOnMarket,
    },
  };
}

function revalidateListingPaths(...ownerSlugs: string[]) {
  revalidatePath("/listings");
  revalidatePath("/");
  for (const slug of new Set(ownerSlugs.filter(Boolean))) {
    revalidatePath(`/contacts/${slug}`);
  }
}

export async function createListingAction(
  formData: FormData,
): Promise<CreateListingResult> {
  const parsed = parseListingInput(formData);
  if (!parsed.ok) return parsed;

  try {
    const { id } = await createListing(parsed.input);
    revalidateListingPaths(parsed.input.ownerSlug);
    return { ok: true, id };
  } catch (err) {
    console.error("createListing failed:", err);
    const message =
      err instanceof Error && err.message === "Seller contact not found."
        ? "Selected seller was not found."
        : "Could not save listing. Try again.";
    return { ok: false, error: message };
  }
}

export async function updateListingAction(
  formData: FormData,
): Promise<UpdateListingResult> {
  const idRaw = String(formData.get("id") ?? "").trim();
  const id = Number.parseInt(idRaw, 10);
  if (Number.isNaN(id) || id < 1) {
    return { ok: false, error: "Missing listing." };
  }

  const parsed = parseListingInput(formData);
  if (!parsed.ok) return parsed;

  try {
    const result = await updateListing({ id, ...parsed.input });
    revalidateListingPaths(result.previousOwnerSlug, result.ownerSlug);
    return { ok: true, id: result.id };
  } catch (err) {
    console.error("updateListing failed:", err);
    let message = "Could not update listing. Try again.";
    if (err instanceof Error) {
      if (err.message === "Listing not found.") {
        message = "Listing was not found.";
      } else if (err.message === "Seller contact not found.") {
        message = "Selected seller was not found.";
      }
    }
    return { ok: false, error: message };
  }
}
