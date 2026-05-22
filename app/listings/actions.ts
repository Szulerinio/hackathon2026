"use server";

import { revalidatePath } from "next/cache";
import {
  runDealMatchForListing,
  type DealMatchMeta,
} from "../../lib/ai/deal-match-meta";
import {
  createListing,
  updateListing,
  type CreateListingInput,
} from "../../lib/listings-mutations";
import { prisma } from "../../lib/prisma";

export type CreateListingResult =
  | ({ ok: true; id: number } & DealMatchMeta)
  | { ok: false; error: string };

export type UpdateListingResult = CreateListingResult;

const LISTING_STATUSES = ["active", "sold", "withdrawn"] as const;

function parseListingInput(
  formData: FormData,
): { ok: true; input: CreateListingInput } | { ok: false; error: string } {
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
      description: String(formData.get("description") ?? ""),
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
  revalidatePath("/deals");
  revalidatePath("/ai/logs");
  for (const slug of new Set(ownerSlugs.filter(Boolean))) {
    revalidatePath(`/contacts/${slug}`);
  }
}

function normalizeField(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function listingFieldsChanged(
  existing: {
    address: string | null;
    title: string;
    description: string | null;
    valueDisplay: string | null;
    status: string;
    daysOnMarket: number | null;
    owner: { slug: string };
  },
  input: CreateListingInput,
): boolean {
  const address = input.address.trim();
  const description = normalizeField(input.description);
  const price = normalizeField(input.price);
  const existingAddress =
    normalizeField(existing.address) || normalizeField(existing.title);

  if (existingAddress !== address) return true;
  if (normalizeField(existing.description) !== description) return true;
  if (normalizeField(existing.valueDisplay) !== price) return true;
  if (existing.owner.slug !== input.ownerSlug.trim()) return true;
  if (existing.status !== input.status) return true;
  if ((existing.daysOnMarket ?? 0) !== input.daysOnMarket) return true;

  return false;
}

export async function createListingAction(
  formData: FormData,
): Promise<CreateListingResult> {
  const parsed = parseListingInput(formData);
  if (!parsed.ok) return parsed;

  try {
    const { id } = await createListing(parsed.input);
    revalidateListingPaths(parsed.input.ownerSlug);

    const dealMeta = await runDealMatchForListing(id, "listing_create");

    return { ok: true, id, ...dealMeta };
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
    const existing = await prisma.listing.findUnique({
      where: { id },
      include: { owner: { select: { slug: true } } },
    });
    if (!existing) {
      return { ok: false, error: "Listing was not found." };
    }

    const shouldMatch = listingFieldsChanged(existing, parsed.input);
    const result = await updateListing({ id, ...parsed.input });
    revalidateListingPaths(result.previousOwnerSlug, result.ownerSlug);

    let dealMeta: DealMatchMeta = {};
    if (shouldMatch) {
      dealMeta = await runDealMatchForListing(id, "listing_edit");
    }

    return { ok: true, id: result.id, ...dealMeta };
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
