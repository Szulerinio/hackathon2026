import type { DecayTier } from "./decay";
import { prisma } from "./prisma";

const SEVERITIES: DecayTier[] = ["urgent", "warning", "watch", "ok"];

export type CreateAlertInput = {
  contactSlug: string;
  reason: string;
  suggestedAction?: string;
  severity: DecayTier;
  /** YYYY-MM-DD — when the action should happen */
  dueDate?: string;
  daysSince?: number;
};

const DUE_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDueDate(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || !DUE_DATE_RE.test(trimmed)) return null;
  const d = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return trimmed;
}

export type CreateAlertResult = {
  id: number;
  contactSlug: string;
  contactName: string;
};

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function isDecayTier(value: string): value is DecayTier {
  return (SEVERITIES as string[]).includes(value);
}

export async function createAlert(
  input: CreateAlertInput,
): Promise<CreateAlertResult> {
  const contactSlug = input.contactSlug.trim();
  const reason = input.reason.trim();

  const contact = await prisma.contact.findUnique({
    where: { slug: contactSlug },
    select: { id: true, slug: true, name: true },
  });

  if (!contact) {
    throw new Error(`Contact not found for slug: ${contactSlug}`);
  }

  const row = await prisma.alert.create({
    data: {
      contactId: contact.id,
      reason,
      suggestedAction: emptyToNull(input.suggestedAction),
      severity: input.severity,
      dueDate: parseDueDate(input.dueDate),
      daysSince:
        input.daysSince !== undefined && Number.isFinite(input.daysSince)
          ? Math.max(0, Math.round(input.daysSince))
          : null,
      isActive: true,
    },
  });

  return {
    id: row.id,
    contactSlug: contact.slug,
    contactName: contact.name,
  };
}
