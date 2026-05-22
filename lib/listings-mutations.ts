import { prisma } from "./prisma";

export type CreateListingInput = {
  address: string;
  description?: string;
  price?: string;
  ownerSlug: string;
  status: string;
  daysOnMarket: number;
};

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function parseValuePln(display: string): number | null {
  const digits = display.replace(/[^\d]/g, "");
  if (!digits) return null;
  return Number(digits);
}

export async function createListing(
  input: CreateListingInput,
): Promise<{ id: number }> {
  const address = input.address.trim();
  const owner = await prisma.contact.findUnique({
    where: { slug: input.ownerSlug },
    select: { id: true },
  });
  if (!owner) {
    throw new Error("Seller contact not found.");
  }

  const price = input.price?.trim() ?? "";
  const row = await prisma.listing.create({
    data: {
      title: address,
      address,
      description: emptyToNull(input.description),
      ownerId: owner.id,
      valueDisplay: emptyToNull(price),
      valuePln: price ? parseValuePln(price) : null,
      status: input.status,
      daysOnMarket: input.daysOnMarket,
    },
  });

  return { id: row.id };
}

export type UpdateListingInput = CreateListingInput & {
  id: number;
};

export async function updateListing(
  input: UpdateListingInput,
): Promise<{
  id: number;
  previousOwnerSlug: string;
  ownerSlug: string;
}> {
  const existing = await prisma.listing.findUnique({
    where: { id: input.id },
    include: { owner: { select: { slug: true } } },
  });
  if (!existing) {
    throw new Error("Listing not found.");
  }

  const address = input.address.trim();
  const owner = await prisma.contact.findUnique({
    where: { slug: input.ownerSlug },
    select: { id: true, slug: true },
  });
  if (!owner) {
    throw new Error("Seller contact not found.");
  }

  const price = input.price?.trim() ?? "";
  const row = await prisma.listing.update({
    where: { id: input.id },
    data: {
      title: address,
      address,
      description: emptyToNull(input.description),
      ownerId: owner.id,
      valueDisplay: emptyToNull(price),
      valuePln: price ? parseValuePln(price) : null,
      status: input.status,
      daysOnMarket: input.daysOnMarket,
    },
  });

  return {
    id: row.id,
    previousOwnerSlug: existing.owner.slug,
    ownerSlug: owner.slug,
  };
}
