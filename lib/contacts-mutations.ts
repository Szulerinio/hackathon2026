import {
  deriveContactType,
  deriveDecayThresholdDays,
} from "./derive-contact";
import { formatDate, getCrmToday, slugify } from "./decay";
import { prisma } from "./prisma";

export type CreateContactInput = {
  name: string;
  relationship?: string;
  source?: string;
  context?: string;
  notes?: string;
  phone?: string;
  email?: string;
  tags: string[];
  participantRole?: "seller" | "buyer" | "both" | null;
};

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function ensureUniqueSlug(name: string): Promise<string> {
  let base = slugify(name);
  if (!base) base = `contact-${Date.now()}`;

  let candidate = base;
  let n = 2;
  while (await prisma.contact.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${n}`;
    n++;
  }
  return candidate;
}

export async function createContact(
  input: CreateContactInput,
): Promise<{ slug: string }> {
  const name = input.name.trim();
  const relationship = emptyToNull(input.relationship);
  const tags = input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean);
  const slug = await ensureUniqueSlug(name);

  const row = await prisma.contact.create({
    data: {
      slug,
      name,
      relationship,
      source: emptyToNull(input.source),
      context: emptyToNull(input.context),
      notes: emptyToNull(input.notes),
      phone: emptyToNull(input.phone),
      email: emptyToNull(input.email),
      tags: JSON.stringify(tags),
      contactType: deriveContactType(tags),
      participantRole: input.participantRole ?? null,
      decayThresholdDays: deriveDecayThresholdDays(tags),
      lastInteractionDate: formatDate(getCrmToday()),
      lastInteractionSummary: null,
    },
  });

  return { slug: row.slug };
}

export type UpdateContactInput = CreateContactInput & {
  slug: string;
};

export async function updateContact(
  input: UpdateContactInput,
): Promise<{ slug: string }> {
  const name = input.name.trim();
  const relationship = emptyToNull(input.relationship);
  const tags = input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean);

  const row = await prisma.contact.update({
    where: { slug: input.slug },
    data: {
      name,
      relationship,
      source: emptyToNull(input.source),
      context: emptyToNull(input.context),
      notes: emptyToNull(input.notes),
      phone: emptyToNull(input.phone),
      email: emptyToNull(input.email),
      tags: JSON.stringify(tags),
      contactType: deriveContactType(tags),
      participantRole: input.participantRole ?? null,
      decayThresholdDays: deriveDecayThresholdDays(tags),
    },
  });

  return { slug: row.slug };
}
