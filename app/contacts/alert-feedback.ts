import type { AlertExtractionMeta } from "../../lib/ai/alert-extraction-meta";

const STORAGE_PREFIX = "contact-ai-banner:";

export function alertMessageFromMeta(
  meta: AlertExtractionMeta,
): string | null {
  if (meta.alertsCreated && meta.alertsCreated > 0) {
    return meta.alertSummary ?? `Created ${meta.alertsCreated} alert(s).`;
  }
  if (meta.alertError) {
    return `Saved. Alerts: ${meta.alertError}`;
  }
  return null;
}

export function stashContactAiBanner(slug: string, message: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${STORAGE_PREFIX}${slug}`, message);
}

export function popContactAiBanner(slug: string): string | null {
  if (typeof window === "undefined") return null;
  const key = `${STORAGE_PREFIX}${slug}`;
  const message = sessionStorage.getItem(key);
  if (message) sessionStorage.removeItem(key);
  return message;
}
