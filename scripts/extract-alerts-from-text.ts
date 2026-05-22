import "dotenv/config";
import { extractAlertsFromText } from "../lib/ai/extract-alerts-from-text";
import { getClaudeConfig } from "../lib/claude/config";

async function main() {
  const text =
    process.argv.slice(2).join(" ") ||
    `Anna Krajewska is waiting for the CEO apartment shortlist since last week.
She mentioned a tight deadline — needs 3 options by Friday.
Marek Kowalski has a viewing today; bring the rental yield comparison sheet.`;

  const contactSlug = process.env.CONTACT_SLUG?.trim();

  console.log(`Model: ${getClaudeConfig().cheapModel}`);
  console.log("Analyzing text with Claude + create_alert tool...\n");
  if (contactSlug) console.log(`Primary contact: ${contactSlug}\n`);

  const result = await extractAlertsFromText({ text, contactSlug });

  console.log(result.summary);
  console.log(`Iterations: ${result.iterations}\n`);

  if (result.created.length === 0) {
    console.log("No alerts created.");
    return;
  }

  for (const a of result.created) {
    console.log(`  #${a.alertId} — ${a.contactName} (${a.contactSlug})`);
  }
  console.log("\nSee http://localhost:3000/alerts");
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
