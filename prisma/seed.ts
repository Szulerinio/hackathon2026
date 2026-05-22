import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/prisma";
import {
  deriveContactType,
  deriveDecayThresholdDays,
  deriveIsHousehold,
  parseTags,
} from "../lib/derive-contact";
import { slugify } from "../lib/decay";
import { ALERTS, CONTACT_TYPES, DEALS, LISTINGS } from "../lib/mock-data";

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

const REFERRAL_LINKS: [string, string][] = [
  ["Natalia Kwiatkowska", "Anna Krajewska"],
  ["Beata Mazur", "Teresa Głowacka"],
  ["Agnieszka Lis", "Karolina Nowicka"],
];

const LIFE_EVENTS: [string, string, string][] = [
  ["Jakub Wójcik", "2026-06-15", "Baby due (Magda)"],
  ["Paweł Adamczyk", "2026-09-12", "Wedding day"],
];

function parseValuePln(display: string): number | null {
  const digits = display.replace(/[^\d]/g, "");
  if (!digits) return null;
  return Number(digits);
}

async function main() {
  await prisma.alert.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.listing.deleteMany();
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
        participantRole: CONTACT_TYPES[row.name] ?? null,
        decayThresholdDays: deriveDecayThresholdDays(tags),
        isHousehold: deriveIsHousehold(row.name, row.relationship, tags),
      },
    });
    idByName.set(row.name, contact.id);
  }

  for (const [child, parent] of REFERRAL_LINKS) {
    const childId = idByName.get(child);
    const parentId = idByName.get(parent);
    if (childId && parentId) {
      await prisma.contact.update({
        where: { id: childId },
        data: { referredById: parentId },
      });
    }
  }

  for (const [name, date, label] of LIFE_EVENTS) {
    const id = idByName.get(name);
    if (id) {
      await prisma.contact.update({
        where: { id },
        data: { lifeEventDate: date, lifeEventLabel: label },
      });
    }
  }

  async function ensureContact(name: string, role?: string) {
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
        participantRole: role ?? CONTACT_TYPES[name] ?? "seller",
        decayThresholdDays: 90,
      },
    });
    idByName.set(name, contact.id);
    return contact.id;
  }

  const listingIdByAddress = new Map<string, number>();

  for (const listing of LISTINGS) {
    const ownerId = await ensureContact(listing.sellerName, "seller");
    const row = await prisma.listing.create({
      data: {
        title: listing.address,
        address: listing.address,
        ownerId,
        valueDisplay: listing.price,
        valuePln: parseValuePln(listing.price),
        status: listing.status,
        daysOnMarket: listing.daysOnMarket,
      },
    });
    listingIdByAddress.set(listing.address, row.id);
  }

  for (const deal of DEALS) {
    const buyerId = await ensureContact(deal.buyerName);

    let listingId = listingIdByAddress.get(deal.propertyAddress);
    if (!listingId) {
      const mockListing = LISTINGS.find(
        (l) =>
          deal.propertyAddress.includes(l.address.split(",")[0].trim()) ||
          l.address.includes(deal.propertyAddress.split(",")[0].trim()),
      );
      const sellerName = mockListing?.sellerName ?? "Tomasz Wierzbicki";
      const ownerId = await ensureContact(sellerName, "seller");
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
