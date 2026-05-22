import { cache } from "react";
import type { Contact as DbContact } from "@/app/generated/prisma/client";
import { prisma } from "./prisma";
import { avatarClass } from "./avatar";
import {
  computeDecayWithThreshold,
  formatDate,
  getInitials,
  slugify,
  type DecayTier,
} from "./decay";

export type Contact = {
  id: string;
  name: string;
  relationship: string;
  source: string;
  context: string;
  lastInteractionDate: string;
  lastInteractionSummary: string;
  tags: string[];
  notes: string;
  initials: string;
  daysSince: number;
  decayScore: number;
  decayTier: DecayTier;
  isHousehold: boolean;
};

export type Listing = {
  id: number;
  title: string;
  subtitle: string;
  address: string;
  ownerId: string;
  ownerName: string;
  value: string;
  status: string;
};

export type Deal = {
  id: number;
  listingId: number;
  contactId: string | null;
  title: string;
  subtitle: string;
  status: string;
  statusClass: string;
  value: string;
  initials: string;
  avClass: string;
};

export type Alert = {
  id: number;
  contactId: string;
  contactName: string;
  initials: string;
  avClass: string;
  reason: string;
  suggestedAction: string;
  severity: DecayTier;
  daysSince: number;
};

function parseTagsJson(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* legacy comma-separated */
  }
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function mapContact(row: DbContact): Contact {
  const tags = parseTagsJson(row.tags);
  const lastInteractionDate = formatDate(row.lastInteractionDate);
  const decay = computeDecayWithThreshold(
    lastInteractionDate,
    row.decayThresholdDays,
  );

  return {
    id: row.slug,
    name: row.name,
    relationship: row.relationship ?? "",
    source: row.source ?? "",
    context: row.context ?? "",
    lastInteractionDate,
    lastInteractionSummary: row.lastInteractionSummary ?? "",
    tags,
    notes: row.notes ?? "",
    initials: getInitials(row.name),
    daysSince: decay.days,
    decayScore: decay.score,
    decayTier: decay.tier,
    isHousehold: row.isHousehold,
  };
}

const DEAL_STATUS_CLASS: Record<string, string> = {
  open: "s-blue",
  closed: "s-dim",
  listing: "s-amber",
  viewing: "s-blue",
  hot_lead: "s-red",
  cold_lead: "s-dim",
  scouting: "s-dim",
};

function formatDealStatus(status: string): string {
  return status.replace(/_/g, " ");
}

export const getContacts = cache(async (): Promise<Contact[]> => {
  const rows = await prisma.contact.findMany({ orderBy: { name: "asc" } });
  return rows.map(mapContact);
});

export const getContact = cache(
  async (id: string): Promise<Contact | undefined> => {
    const row = await prisma.contact.findUnique({ where: { slug: id } });
    return row ? mapContact(row) : undefined;
  },
);

export const getListings = cache(async (): Promise<Listing[]> => {
  const rows = await prisma.listing.findMany({
    include: { owner: true },
    orderBy: { title: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? "",
    address: row.address ?? "",
    ownerId: row.owner.slug,
    ownerName: row.owner.name,
    value: row.valueDisplay ?? "",
    status: row.status,
  }));
});

export const getDeals = cache(async (): Promise<Deal[]> => {
  const rows = await prisma.deal.findMany({
    include: {
      listing: { include: { owner: true } },
      buyer: true,
    },
    orderBy: { valuePln: "desc" },
  });

  return rows.map((row) => {
    const person = row.buyer ?? row.listing.owner;
    const contactId = person.slug;
    const title = row.title ?? row.listing.title;
    const subtitle =
      row.subtitle ??
      `${person.name}${row.buyer ? "" : ` · owner`}`;

    return {
      id: row.id,
      listingId: row.listingId,
      contactId,
      title,
      subtitle,
      status: formatDealStatus(row.status),
      statusClass: DEAL_STATUS_CLASS[row.status] ?? "s-dim",
      value: row.valueDisplay ?? "",
      initials: getInitials(person.name),
      avClass: avatarClass(contactId),
    };
  });
});

export const getAlerts = cache(async (): Promise<Alert[]> => {
  const rows = await prisma.alert.findMany({
    where: { isActive: true },
    include: { contact: true },
    orderBy: [{ severity: "asc" }, { daysSince: "desc" }],
  });

  const severityOrder: Record<string, number> = {
    urgent: 0,
    warning: 1,
    watch: 2,
    ok: 3,
  };

  rows.sort(
    (a, b) =>
      (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9) ||
      (b.daysSince ?? 0) - (a.daysSince ?? 0),
  );

  return rows.map((row) => {
    const contactId = row.contact.slug;
    return {
      id: row.id,
      contactId,
      contactName: row.contact.name,
      initials: getInitials(row.contact.name),
      avClass: avatarClass(contactId),
      reason: row.reason,
      suggestedAction: row.suggestedAction ?? "",
      severity: row.severity as DecayTier,
      daysSince: row.daysSince ?? 0,
    };
  });
});
