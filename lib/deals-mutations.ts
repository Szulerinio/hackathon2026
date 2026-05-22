import { prisma } from "./prisma";
import { parseValuePln } from "./listings-mutations";

export type CreateDealInput = {
  buyerSlug: string;
  listingId: number;
  status: string;
  value?: string;
  lastActivityDate: string;
};

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createDeal(
  input: CreateDealInput,
): Promise<{ id: number; buyerSlug: string }> {
  const buyer = await prisma.contact.findUnique({
    where: { slug: input.buyerSlug },
    select: { id: true, slug: true },
  });
  if (!buyer) {
    throw new Error("Buyer contact not found.");
  }

  const listing = await prisma.listing.findUnique({
    where: { id: input.listingId },
    select: { id: true, address: true, title: true },
  });
  if (!listing) {
    throw new Error("Listing not found.");
  }

  const propertyAddress = listing.address ?? listing.title;
  const value = input.value?.trim() ?? "";

  const row = await prisma.deal.create({
    data: {
      listingId: listing.id,
      buyerId: buyer.id,
      status: input.status,
      title: propertyAddress,
      valueDisplay: emptyToNull(value),
      valuePln: value ? parseValuePln(value) : null,
      lastActivityDate: input.lastActivityDate,
      closedAt: input.status === "closed" ? new Date() : null,
    },
  });

  return { id: row.id, buyerSlug: buyer.slug };
}

export type UpdateDealInput = CreateDealInput & {
  id: number;
};

export async function updateDeal(
  input: UpdateDealInput,
): Promise<{
  id: number;
  previousBuyerSlug: string;
  buyerSlug: string;
}> {
  const existing = await prisma.deal.findUnique({
    where: { id: input.id },
    include: { buyer: { select: { slug: true } } },
  });
  if (!existing) {
    throw new Error("Deal not found.");
  }

  const buyer = await prisma.contact.findUnique({
    where: { slug: input.buyerSlug },
    select: { id: true, slug: true },
  });
  if (!buyer) {
    throw new Error("Buyer contact not found.");
  }

  const listing = await prisma.listing.findUnique({
    where: { id: input.listingId },
    select: { id: true, address: true, title: true },
  });
  if (!listing) {
    throw new Error("Listing not found.");
  }

  const propertyAddress = listing.address ?? listing.title;
  const value = input.value?.trim() ?? "";
  const wasClosed = existing.status === "closed";
  const isClosed = input.status === "closed";

  const row = await prisma.deal.update({
    where: { id: input.id },
    data: {
      listingId: listing.id,
      buyerId: buyer.id,
      status: input.status,
      title: propertyAddress,
      valueDisplay: emptyToNull(value),
      valuePln: value ? parseValuePln(value) : null,
      lastActivityDate: input.lastActivityDate,
      closedAt:
        isClosed && !wasClosed
          ? new Date()
          : !isClosed
            ? null
            : existing.closedAt,
    },
  });

  return {
    id: row.id,
    previousBuyerSlug: existing.buyer?.slug ?? "",
    buyerSlug: buyer.slug,
  };
}

export async function moveDeal(
  id: number,
  status: string,
): Promise<{ buyerSlug: string }> {
  const existing = await prisma.deal.findUnique({
    where: { id },
    include: { buyer: { select: { slug: true } } },
  });
  if (!existing) throw new Error("Deal not found.");

  await prisma.deal.update({
    where: { id },
    data: {
      status,
      closedAt: status === "closed" ? new Date() : existing.closedAt,
    },
  });

  return { buyerSlug: existing.buyer?.slug ?? "" };
}
