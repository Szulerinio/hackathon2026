import { extractAlertsFromTextAction } from "../../app/alerts/actions";

export type AlertExtractionMeta = {
  alertsCreated?: number;
  alertSummary?: string;
  alertError?: string;
};

export async function runAlertExtraction(
  text: string,
  contactSlug: string,
  source: string,
): Promise<AlertExtractionMeta> {
  const ai = await extractAlertsFromTextAction(text, contactSlug, source);
  if (ai.ok) {
    return {
      alertsCreated: ai.created.length,
      alertSummary: ai.summary,
    };
  }
  return { alertError: ai.error };
}
