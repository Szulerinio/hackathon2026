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

type DealSeed = {
  contactName: string;
  title: string;
  subtitle: string;
  status: string;
  valueDisplay: string;
  valuePln: number;
};

type AlertSeed = {
  contactName: string;
  reason: string;
  suggestedAction: string;
  severity: "urgent" | "warning";
  daysSince: number;
};

const DEALS: DealSeed[] = [
  {
    contactName: "Beata Mazur",
    title: "Sienkiewicza — family home sale",
    subtitle: "Beata Mazur · widow · seller + future buyer",
    status: "listing",
    valueDisplay: "850K",
    valuePln: 850_000,
  },
  {
    contactName: "Marek Kowalski",
    title: "University district — investment apt",
    subtitle: "Marek Kowalski · investor · 2nd purchase",
    status: "viewing",
    valueDisplay: "420K",
    valuePln: 420_000,
  },
  {
    contactName: "Anna Krajewska",
    title: "Luxury 200sqm — via Anna K",
    subtitle: "CEO Laboratorium Kosmetyczne · referral",
    status: "hot_lead",
    valueDisplay: "1.2M+",
    valuePln: 1_200_000,
  },
  {
    contactName: "Szymon Kaczmarek",
    title: "Airbnb 2-bed city center",
    subtitle: "Szymon Kaczmarek · car dealer · BNI",
    status: "cold_lead",
    valueDisplay: "380K",
    valuePln: 380_000,
  },
  {
    contactName: "Ewa Szymańska",
    title: "Commercial office 80sqm Kazimierz",
    subtitle: "Ewa Szymańska · notary · wants to own",
    status: "scouting",
    valueDisplay: "600K",
    valuePln: 600_000,
  },
];

const ALERTS: AlertSeed[] = [
  {
    contactName: "Anna Krajewska",
    reason:
      "Your best referral source. Her CEO's 200sqm luxury search — you promised 3 options last week. Every day of silence risks the deal.",
    suggestedAction: "Send luxury listings in Śródmieście today",
    severity: "urgent",
    daysSince: 33,
  },
  {
    contactName: "Stefan Fischer",
    reason:
      "Expat client with investment ambitions. You said you'd research non-resident tax 55 days ago. Silence erodes trust faster than a wrong answer.",
    suggestedAction: "Send answer or honest status update now",
    severity: "urgent",
    daysSince: 55,
  },
  {
    contactName: "Szymon Kaczmarek",
    reason:
      "Came back from Dubai fired up about an Airbnb apartment. Said he'd call — he didn't. These buyers go quiet and sign with someone else.",
    suggestedAction: "Call today, open with the Dubai trip",
    severity: "urgent",
    daysSince: 63,
  },
  {
    contactName: "Beata Mazur",
    reason:
      "Anxious widow selling her family home. Waiting 2 weeks on the parking spot land registry check. Small thing to you, huge thing to her.",
    suggestedAction: "Check land registry now, call her with the answer",
    severity: "warning",
    daysSince: 40,
  },
];

const REFERRAL_LINKS: [string, string][] = [
  ["Natalia Kwiatkowska", "Anna Krajewska"],
  ["Beata Mazur", "Teresa Głowacka"],
  ["Agnieszka Lis", "Karolina Nowicka"],
];

const LIFE_EVENTS: [string, string, string][] = [
  ["Jakub Wójcik", "2026-06-15", "Baby due (Magda)"],
  ["Paweł Adamczyk", "2026-09-12", "Wedding day"],
];

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

  for (const deal of DEALS) {
    const ownerId = idByName.get(deal.contactName);
    if (!ownerId) {
      console.warn(`Skipping deal — contact not found: ${deal.contactName}`);
      continue;
    }

    const listing = await prisma.listing.create({
      data: {
        title: deal.title,
        subtitle: deal.subtitle,
        ownerId,
        valueDisplay: deal.valueDisplay,
        valuePln: deal.valuePln,
        status: "active",
      },
    });

    await prisma.deal.create({
      data: {
        listingId: listing.id,
        buyerId: ownerId,
        status: deal.status,
        title: deal.title,
        subtitle: deal.subtitle,
        valueDisplay: deal.valueDisplay,
        valuePln: deal.valuePln,
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
        suggestedAction: alert.suggestedAction,
        severity: alert.severity,
        daysSince: alert.daysSince,
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
