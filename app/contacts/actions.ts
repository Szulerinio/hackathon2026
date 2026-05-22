"use server";

import { revalidatePath } from "next/cache";
import {
  runAlertExtraction,
  type AlertExtractionMeta,
} from "../../lib/ai/alert-extraction-meta";
import {
  runDealMatchForContact,
  type DealMatchMeta,
} from "../../lib/ai/deal-match-meta";
import { formatContactFieldsForAlertExtraction } from "../../lib/ai/format-contact-text";
import {
  createContact,
  updateContact,
  type CreateContactInput,
} from "../../lib/contacts-mutations";
import { parseTags } from "../../lib/derive-contact";
import { prisma } from "../../lib/prisma";

export type CreateContactResult =
  | ({ ok: true; slug: string } & AlertExtractionMeta & DealMatchMeta)
  | { ok: false; error: string };

export type UpdateContactResult =
  | ({ ok: true; slug: string } & AlertExtractionMeta & DealMatchMeta)
  | { ok: false; error: string };

function parseParticipantRole(
  raw: string,
): "seller" | "buyer" | "both" | null {
  if (raw === "seller" || raw === "buyer" || raw === "both") return raw;
  return null;
}

function parseContactInput(
  formData: FormData,
): { ok: true; input: CreateContactInput } | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { ok: false, error: "Name is required (at least 2 characters)." };
  }

  const email = String(formData.get("email") ?? "").trim();
  if (email && !email.includes("@")) {
    return { ok: false, error: "Enter a valid email or leave it empty." };
  }

  const tagsRaw = String(formData.get("tags") ?? "");
  const tags = parseTags(tagsRaw).map((t) => t.toLowerCase());

  return {
    ok: true,
    input: {
      name,
      relationship: String(formData.get("relationship") ?? ""),
      source: String(formData.get("source") ?? ""),
      context: String(formData.get("context") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email,
      tags,
      participantRole: parseParticipantRole(
        String(formData.get("participantRole") ?? ""),
      ),
    },
  };
}

function revalidateContactPaths(slug: string) {
  revalidatePath("/contacts");
  revalidatePath("/");
  revalidatePath("/alerts");
  revalidatePath("/deals");
  revalidatePath("/ai/logs");
  revalidatePath(`/contacts/${slug}`);
}

function normalizeField(value: string | null | undefined): string {
  return (value ?? "").trim();
}

async function extractAlertsFromContactFields(
  input: {
    contactName: string;
    contactSlug: string;
    context: string;
    notes: string;
  },
  mode: "create" | "edit",
): Promise<AlertExtractionMeta> {
  const text = formatContactFieldsForAlertExtraction({
    contactName: input.contactName,
    context: input.context || null,
    notes: input.notes || null,
    mode,
  });
  if (text.trim().length < 10) return {};
  return runAlertExtraction(
    text,
    input.contactSlug,
    mode === "create" ? "contact_create" : "contact_edit",
  );
}

export async function createContactAction(
  formData: FormData,
): Promise<CreateContactResult> {
  const parsed = parseContactInput(formData);
  if (!parsed.ok) return parsed;

  const context = (parsed.input.context ?? "").trim();
  const notes = (parsed.input.notes ?? "").trim();

  try {
    const { slug } = await createContact(parsed.input);

    let alertMeta: AlertExtractionMeta = {};
    let dealMeta: DealMatchMeta = {};
    if (context || notes) {
      alertMeta = await extractAlertsFromContactFields(
        {
          contactName: parsed.input.name,
          contactSlug: slug,
          context,
          notes,
        },
        "create",
      );
      dealMeta = await runDealMatchForContact(slug, "contact_create");
    }

    revalidateContactPaths(slug);
    return { ok: true, slug, ...alertMeta, ...dealMeta };
  } catch (err) {
    console.error("createContact failed:", err);
    return { ok: false, error: "Could not save contact. Try again." };
  }
}

export async function updateContactAction(
  formData: FormData,
): Promise<UpdateContactResult> {
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) {
    return { ok: false, error: "Missing contact." };
  }

  const parsed = parseContactInput(formData);
  if (!parsed.ok) return parsed;

  const existing = await prisma.contact.findUnique({ where: { slug } });
  if (!existing) {
    return { ok: false, error: "Contact not found." };
  }

  const newContext = (parsed.input.context ?? "").trim();
  const newNotes = (parsed.input.notes ?? "").trim();
  const contextChanged =
    normalizeField(existing.context) !== newContext;
  const notesChanged = normalizeField(existing.notes) !== newNotes;

  try {
    const { slug: savedSlug } = await updateContact({
      slug,
      ...parsed.input,
    });

    let alertMeta: AlertExtractionMeta = {};
    let dealMeta: DealMatchMeta = {};
    if (contextChanged || notesChanged) {
      alertMeta = await extractAlertsFromContactFields(
        {
          contactName: existing.name,
          contactSlug: savedSlug,
          context: newContext,
          notes: newNotes,
        },
        "edit",
      );
      dealMeta = await runDealMatchForContact(savedSlug, "contact_edit");
    }

    revalidateContactPaths(savedSlug);
    return { ok: true, slug: savedSlug, ...alertMeta, ...dealMeta };
  } catch (err) {
    console.error("updateContact failed:", err);
    return { ok: false, error: "Could not update contact. Try again." };
  }
}
