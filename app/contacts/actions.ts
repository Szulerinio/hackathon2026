"use server";

import { revalidatePath } from "next/cache";
import {
  createContact,
  updateContact,
  type CreateContactInput,
} from "../../lib/contacts-mutations";
import { parseTags } from "../../lib/derive-contact";
import { formatDate, getCrmToday } from "../../lib/decay";

export type CreateContactResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export type UpdateContactResult = CreateContactResult;

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

  const lastInteractionDateRaw = String(
    formData.get("lastInteractionDate") ?? "",
  ).trim();

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
      lastInteractionDate:
        lastInteractionDateRaw || formatDate(getCrmToday()),
      lastInteractionSummary: String(
        formData.get("lastInteractionSummary") ?? "",
      ),
    },
  };
}

function revalidateContactPaths(slug: string) {
  revalidatePath("/contacts");
  revalidatePath("/");
  revalidatePath(`/contacts/${slug}`);
}

export async function createContactAction(
  formData: FormData,
): Promise<CreateContactResult> {
  const parsed = parseContactInput(formData);
  if (!parsed.ok) return parsed;

  try {
    const { slug } = await createContact(parsed.input);
    revalidateContactPaths(slug);
    return { ok: true, slug };
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

  try {
    const { slug: savedSlug } = await updateContact({
      slug,
      ...parsed.input,
    });
    revalidateContactPaths(savedSlug);
    return { ok: true, slug: savedSlug };
  } catch (err) {
    console.error("updateContact failed:", err);
    return { ok: false, error: "Could not update contact. Try again." };
  }
}
