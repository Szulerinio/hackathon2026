/** Override with CRM_TODAY=YYYY-MM-DD for frozen demo dates. */
export function getCrmToday(): Date {
  const override = process.env.CRM_TODAY;
  if (override) return new Date(`${override}T12:00:00`);
  return new Date();
}

export const CRM_TODAY = getCrmToday();

const THRESHOLDS: Record<string, number> = {
  "active client": 7,
  "hot lead": 10,
  "key partner": 14,
  "close partner": 14,
  "close friend": 30,
  "warm lead": 30,
  "referral source": 21,
  family: 30,
  investor: 14,
  contractor: 21,
  "past client": 90,
  professional: 60,
  "first-time buyer": 7,
};

export type DecayTier = "urgent" | "warning" | "watch" | "ok";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ą/g, "a")
    .replace(/ę/g, "e")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ł/g, "l")
    .replace(/ź/g, "z")
    .replace(/ż/g, "z")
    .replace(/ć/g, "c")
    .replace(/ń/g, "n")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

export function computeDaysSince(dateStr: string, today = getCrmToday()): number {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  return Math.max(
    0,
    Math.floor((today.getTime() - date.getTime()) / 86400000),
  );
}

function tierFromScore(score: number): DecayTier {
  if (score >= 80) return "urgent";
  if (score >= 50) return "warning";
  if (score >= 25) return "watch";
  return "ok";
}

export function computeDecay(
  tags: string[],
  lastDate: string,
): { score: number; days: number; tier: DecayTier } {
  const days = computeDaysSince(lastDate);
  let threshold = 180;
  for (const tag of tags) {
    const t = tag.trim().toLowerCase();
    if (THRESHOLDS[t] !== undefined) threshold = Math.min(threshold, THRESHOLDS[t]);
  }
  const score = Math.min(100, Math.round((days / threshold) * 50));
  return { score, days, tier: tierFromScore(score) };
}

export function computeDecayWithThreshold(
  lastDate: string,
  thresholdDays: number,
): { score: number; days: number; tier: DecayTier } {
  const days = computeDaysSince(lastDate);
  const threshold = thresholdDays > 0 ? thresholdDays : 180;
  const score = Math.min(100, Math.round((days / threshold) * 50));
  return { score, days, tier: tierFromScore(score) };
}
