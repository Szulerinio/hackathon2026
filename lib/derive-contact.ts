const TAG_TO_CONTACT_TYPE: Record<string, string> = {
  "active client": "active_client",
  "hot lead": "hot_lead",
  "key partner": "key_partner",
  "close partner": "key_partner",
  "referral source": "referral_source",
  "close friend": "close_friend",
  "warm lead": "warm_lead",
  family: "family",
  investor: "investor",
  contractor: "contractor",
  "past client": "past_client",
  professional: "professional",
  "first-time buyer": "first_time_buyer",
};

const TAG_TO_DECAY_DAYS: Record<string, number> = {
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

export function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function deriveContactType(tags: string[]): string | null {
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (TAG_TO_CONTACT_TYPE[key]) return TAG_TO_CONTACT_TYPE[key];
  }
  return null;
}

export function deriveDecayThresholdDays(tags: string[]): number {
  let threshold = 180;
  for (const tag of tags) {
    const days = TAG_TO_DECAY_DAYS[tag.toLowerCase()];
    if (days !== undefined) threshold = Math.min(threshold, days);
  }
  return threshold;
}


