import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/prisma";

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

async function main() {
  const csvPath = join(__dirname, "../dataset-rafal.csv");
  const rows = parse(readFileSync(csvPath, "utf-8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];

  await prisma.contact.deleteMany();

  const { count } = await prisma.contact.createMany({
    data: rows.map((row) => ({
      name: row.name,
      relationship: row.relationship || null,
      source: row.source || null,
      context: row.context || null,
      lastInteractionDate: row.last_interaction_date || null,
      lastInteractionSummary: row.last_interaction_summary || null,
      tags: row.tags || null,
      notes: row.notes || null,
    })),
  });

  console.log(`Seeded ${count} contacts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
