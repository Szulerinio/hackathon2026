import { cache } from "react";
import type {
  Contact as DbContact,
  HouseholdMember as DbHouseholdMember,
} from "@/app/generated/prisma/client";
import { prisma } from "./prisma";
import { avatarClass } from "./avatar";
import {
  computeDecayWithThreshold,
  formatDate,
  getInitials,
  slugify,
  type DecayTier,
} from "./decay";

export type ParticipantRole = "seller" | "buyer" | "both";

export type HouseholdMember = {
  id: number;
  name: string;
  phone: string;
  email: string;
  note: string;
  role: string;
};

export type Contact = {
  id: string;
  name: string;
  displayName: string;
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
  members: HouseholdMember[];
  type: ParticipantRole | null;
  phone: string;
  email: string;
};

export type ListingCard = {
  id: number;
  address: string;
  price: string;
  sellerName: string;
  sellerSlug: string;
  status: string;
  daysOnMarket: number;
};

export type DealRow = {
  id: number;
  buyerName: string;
  buyerSlug: string;
  propertyAddress: string;
  status: string;
  value: string;
  lastActivityDate: string;
};

export type AlertFeedItem = {
  id: number;
  contactName: string;
  contactSlug: string;
  reason: string;
  actionLabel: string;
  createdAt: string;
};

export type TodayStripItem = {
  id: number;
  icon: string;
  shortName: string;
  contactSlug: string;
  summary: string;
};

function shortContactName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? name;
  return `${parts[0]} ${parts[parts.length - 1][0]}`;
}

function todayIconForAction(action: string): string {
  const key = action.toLowerCase();
  if (key.includes("call") || key.includes("prepare")) return "📞";
  if (key.includes("follow")) return "⚠";
  return "📄";
}

export function toTodayStripItems(alerts: AlertFeedItem[]): TodayStripItem[] {
  return alerts.slice(0, 3).map((alert) => ({
    id: alert.id,
    icon: todayIconForAction(alert.actionLabel),
    shortName: shortContactName(alert.contactName),
    contactSlug: alert.contactSlug,
    summary:
      alert.reason.length > 95 ? `${alert.reason.slice(0, 95)}…` : alert.reason,
  }));
}

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

function parseParticipantRole(
  raw: string | null | undefined,
): ParticipantRole | null {
  if (raw === "seller" || raw === "buyer" || raw === "both") return raw;
  return null;
}

type DbContactWithMembers = DbContact & { members: DbHouseholdMember[] };

function mapMember(m: DbHouseholdMember): HouseholdMember {
  return {
    id: m.id,
    name: m.name,
    phone: m.phone ?? "",
    email: m.email ?? "",
    note: m.note ?? "",
    role: m.role ?? "",
  };
}

function mapContact(row: DbContactWithMembers): Contact {
  const tags = parseTagsJson(row.tags);
  const lastInteractionDate = formatDate(row.lastInteractionDate);
  const decay = computeDecayWithThreshold(
    lastInteractionDate,
    row.decayThresholdDays,
  );
  const members = row.members.map(mapMember);

  return {
    id: row.slug,
    name: row.name,
    displayName: row.displayName ?? row.name,
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
    isHousehold: members.length > 0,
    members,
    type: parseParticipantRole(row.participantRole),
    phone: row.phone ?? "",
    email: row.email ?? "",
  };
}

const memberInclude = { members: { orderBy: { createdAt: "asc" as const } } };

export const getContacts = cache(async (): Promise<Contact[]> => {
  const rows = await prisma.contact.findMany({
    orderBy: { name: "asc" },
    include: memberInclude,
  });
  return rows.map(mapContact);
});

export const getContact = cache(
  async (id: string): Promise<Contact | undefined> => {
    const row = await prisma.contact.findUnique({
      where: { slug: id },
      include: memberInclude,
    });
    return row ? mapContact(row) : undefined;
  },
);

export const getListings = cache(async (): Promise<ListingCard[]> => {
  const rows = await prisma.listing.findMany({
    include: { owner: true },
    orderBy: { createdAt: "desc" },
  });

  return rows
    .map((row) => ({
    id: row.id,
    address: row.address ?? row.title,
    price: row.valueDisplay ?? "",
    sellerName: row.owner.name,
    sellerSlug: row.owner.slug,
    status: row.status,
    daysOnMarket: row.daysOnMarket ?? 0,
  }))
    .sort((a, b) => b.daysOnMarket - a.daysOnMarket);
});

export const getListingsForContact = cache(
  async (contactSlug: string): Promise<ListingCard[]> => {
    const listings = await getListings();
    return listings.filter((l) => l.sellerSlug === contactSlug);
  },
);

export const getDeals = cache(async (): Promise<DealRow[]> => {
  const rows = await prisma.deal.findMany({
    include: {
      listing: true,
      buyer: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return rows
    .map((row) => ({
    id: row.id,
    buyerName: row.buyer?.name ?? "—",
    buyerSlug: row.buyer?.slug ?? "",
    propertyAddress: row.listing.address ?? row.listing.title,
    status: row.status,
    value: row.valueDisplay ?? "",
    lastActivityDate: formatDate(row.lastActivityDate),
  }))
    .sort((a, b) => b.lastActivityDate.localeCompare(a.lastActivityDate));
});

export const getDealsForContact = cache(
  async (contactSlug: string): Promise<DealRow[]> => {
    const deals = await getDeals();
    return deals.filter((d) => d.buyerSlug === contactSlug);
  },
);

export const getActiveAlertCount = cache(async (): Promise<number> => {
  return prisma.alert.count({ where: { isActive: true } });
});

export const getAlerts = cache(async (): Promise<Alert[]> => {
  const rows = await prisma.alert.findMany({
    where: { isActive: true },
    include: { contact: true },
    orderBy: { generatedAt: "desc" },
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

export const getAlertFeed = cache(async (): Promise<AlertFeedItem[]> => {
  const rows = await prisma.alert.findMany({
    where: { isActive: true },
    include: { contact: true },
    orderBy: { generatedAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    contactName: row.contact.name,
    contactSlug: row.contact.slug,
    reason: row.reason,
    actionLabel: row.suggestedAction ?? "Follow up",
    createdAt: formatDate(row.generatedAt),
  }));
});

export { slugify };
