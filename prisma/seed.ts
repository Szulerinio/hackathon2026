import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/prisma";
import {
  deriveContactType,
  deriveDecayThresholdDays,
  parseTags,
} from "../lib/derive-contact";
import { slugify } from "../lib/decay";

type CsvRow = {
  name: string;
  relationship: string;
  source: string;
  context: string;
  last_interaction_date: string;
  last_interaction_summary: string;
  tags: string;
  notes: string;
};

type SeedListing = {
  address: string;
  price: string;
  sellerName: string;
  status: string;
  daysOnMarket: number;
};

type SeedDeal = {
  buyerName: string;
  propertyAddress: string;
  status: string;
  value: string;
  lastActivityDate: string;
};

type SeedAlert = {
  contactName: string;
  reason: string;
  actionLabel: string;
  createdAt: string;
};

type SeedMeta = {
  referralLinks: [string, string][];
  lifeEvents: [string, string, string][];
};

const seedDataDir = join(__dirname, "seed-data");

function loadJson<T>(filename: string): T {
  return JSON.parse(readFileSync(join(seedDataDir, filename), "utf-8")) as T;
}

function parseValuePln(display: string): number | null {
  const digits = display.replace(/[^\d]/g, "");
  if (!digits) return null;
  return Number(digits);
}

async function deriveParticipantRoles() {
  const contacts = await prisma.contact.findMany({
    select: {
      id: true,
      ownedListings: { select: { id: true } },
      buyerDeals: { select: { id: true } },
    },
  });

  for (const contact of contacts) {
    const hasListings = contact.ownedListings.length > 0;
    const hasDeals = contact.buyerDeals.length > 0;
    let role: string | null = null;
    if (hasListings && hasDeals) role = "both";
    else if (hasListings) role = "seller";
    else if (hasDeals) role = "buyer";

    await prisma.contact.update({
      where: { id: contact.id },
      data: { participantRole: role },
    });
  }
}

async function main() {
  const LISTINGS = loadJson<SeedListing[]>("listings.json");
  const DEALS = loadJson<SeedDeal[]>("deals.json");
  const ALERTS = loadJson<SeedAlert[]>("alerts.json");
  const { referralLinks, lifeEvents } = loadJson<SeedMeta>("meta.json");

  await prisma.alert.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.householdMember.deleteMany();
  await prisma.contact.deleteMany();

  const csvPath = join(__dirname, "../dataset-rafal.csv");
  const rows = parse(readFileSync(csvPath, "utf-8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];

  const idByName = new Map<string, number>();

  for (const row of rows) {
    const tags = parseTags(row.tags);
    const contact = await prisma.contact.create({
      data: {
        slug: slugify(row.name),
        name: row.name,
        relationship: row.relationship || null,
        source: row.source || null,
        context: row.context || null,
        lastInteractionDate: row.last_interaction_date || null,
        lastInteractionSummary: row.last_interaction_summary || null,
        notes: row.notes || null,
        tags: JSON.stringify(tags),
        contactType: deriveContactType(tags),
        participantRole: null,
        decayThresholdDays: deriveDecayThresholdDays(tags),
      },
    });
    idByName.set(row.name, contact.id);
  }

  for (const [child, parent] of referralLinks) {
    const childId = idByName.get(child);
    const parentId = idByName.get(parent);
    if (childId && parentId) {
      await prisma.contact.update({
        where: { id: childId },
        data: { referredById: parentId },
      });
    }
  }

  for (const [name, date, label] of lifeEvents) {
    const id = idByName.get(name);
    if (id) {
      await prisma.contact.update({
        where: { id },
        data: { lifeEventDate: date, lifeEventLabel: label },
      });
    }
  }

  async function ensureContact(name: string) {
    const existing = idByName.get(name);
    if (existing) return existing;
    const contact = await prisma.contact.create({
      data: {
        slug: slugify(name),
        name,
        relationship: "listing seller (seed)",
        source: "demo data",
        context: "Synthetic contact for property listings in demo dataset.",
        tags: JSON.stringify(["past client"]),
        contactType: "past_client",
        participantRole: null,
        decayThresholdDays: 90,
      },
    });
    idByName.set(name, contact.id);
    return contact.id;
  }

  const listingIdByAddress = new Map<string, number>();

  for (let i = 0; i < LISTINGS.length; i++) {
    const listing = LISTINGS[i];
    const ownerId = await ensureContact(listing.sellerName);
    const row = await prisma.listing.create({
      data: {
        title: listing.address,
        address: listing.address,
        ownerId,
        valueDisplay: listing.price,
        valuePln: parseValuePln(listing.price),
        status: listing.status,
        daysOnMarket: listing.daysOnMarket,
        photoUrl: i < 12 ? `/listings/listing-${i + 1}.png` : null,
      },
    });
    listingIdByAddress.set(listing.address, row.id);
  }

  for (const deal of DEALS) {
    const buyerId = await ensureContact(deal.buyerName);

    let listingId = listingIdByAddress.get(deal.propertyAddress);
    if (!listingId) {
      const matchedListing = LISTINGS.find(
        (l) =>
          deal.propertyAddress.includes(l.address.split(",")[0].trim()) ||
          l.address.includes(deal.propertyAddress.split(",")[0].trim()),
      );
      const sellerName = matchedListing?.sellerName ?? "Tomasz Wierzbicki";
      const ownerId = await ensureContact(sellerName);
      const row = await prisma.listing.create({
        data: {
          title: deal.propertyAddress,
          address: deal.propertyAddress,
          ownerId,
          valueDisplay: deal.value,
          valuePln: parseValuePln(deal.value),
          status: "active",
        },
      });
      listingId = row.id;
      listingIdByAddress.set(deal.propertyAddress, listingId);
    }

    await prisma.deal.create({
      data: {
        listingId,
        buyerId,
        status: deal.status,
        title: deal.propertyAddress,
        valueDisplay: deal.value,
        valuePln: parseValuePln(deal.value),
        lastActivityDate: deal.lastActivityDate,
      },
    });
  }

  const householdSeeds: {
    contactName: string;
    members: { name: string; phone?: string; email?: string; role?: string; note?: string }[];
  }[] = [
    {
      contactName: "Paweł Adamczyk",
      members: [
        { name: "Iga Adamczyk", role: "fiancée", note: "Nurse. Co-decision-maker, equally involved in apartment search. Wedding September 12." },
      ],
    },
    {
      contactName: "Natalia Kwiatkowska",
      members: [
        { name: "Olek", role: "partner", note: "Works at Kraków Technology Park. Concerned about commute times." },
      ],
    },
    {
      contactName: "Marek Kowalski",
      members: [
        { name: "Bożena Kowalska", role: "spouse", note: "Skeptical about real estate investing. Worth addressing her concerns directly." },
      ],
    },
    {
      contactName: "Stefan Fischer",
      members: [
        { name: "Julia Fischer", role: "spouse", note: "Baby daughter. May relocate back to Stuttgart — timing affects investment decisions." },
      ],
    },
  ];

  for (const seed of householdSeeds) {
    const contactId = idByName.get(seed.contactName);
    if (!contactId) {
      console.warn(`Skipping members — contact not found: ${seed.contactName}`);
      continue;
    }
    for (const member of seed.members) {
      await prisma.householdMember.create({
        data: { contactId, ...member },
      });
    }
  }

  await deriveParticipantRoles();

  for (const alert of ALERTS) {
    const contactId = idByName.get(alert.contactName);
    if (!contactId) {
      console.warn(`Skipping alert — contact not found: ${alert.contactName}`);
      continue;
    }
    await prisma.alert.create({
      data: {
        contactId,
        reason: alert.reason,
        suggestedAction: alert.actionLabel,
        severity: "warning",
        generatedAt: new Date(`${alert.createdAt}T12:00:00`),
      },
    });
  }

  const [contacts, listings, deals, alerts] = await Promise.all([
    prisma.contact.count(),
    prisma.listing.count(),
    prisma.deal.count(),
    prisma.alert.count(),
  ]);

  console.log("SQLite seed complete:", { contacts, listings, deals, alerts });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
