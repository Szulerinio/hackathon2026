"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";

export type ActivityActionResult = { ok: true } | { ok: false; error: string };

function revalidate(slug: string) {
  revalidatePath(`/contacts/${slug}`);
  revalidatePath("/contacts");
  revalidatePath("/");
}

async function syncContactInteraction(contactId: number) {
  const latest = await prisma.activityEvent.findFirst({
    where: { contactId },
    orderBy: { date: "desc" },
  });
  await prisma.contact.update({
    where: { id: contactId },
    data: {
      lastInteractionDate: latest?.date ?? null,
      lastInteractionSummary: latest?.notes ?? null,
    },
  });
}

export async function createActivityAction(
  slug: string,
  formData: FormData,
): Promise<ActivityActionResult> {
  const type = String(formData.get("type") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!type) return { ok: false, error: "Type is required." };
  if (!date) return { ok: false, error: "Date is required." };

  const contact = await prisma.contact.findUnique({ where: { slug } });
  if (!contact) return { ok: false, error: "Contact not found." };

  await prisma.activityEvent.create({
    data: { contactId: contact.id, type, date, notes: notes || null },
  });

  await syncContactInteraction(contact.id);
  revalidate(slug);
  return { ok: true };
}

export async function updateActivityAction(
  slug: string,
  activityId: number,
  formData: FormData,
): Promise<ActivityActionResult> {
  const type = String(formData.get("type") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!type) return { ok: false, error: "Type is required." };
  if (!date) return { ok: false, error: "Date is required." };

  const contact = await prisma.contact.findUnique({ where: { slug } });
  if (!contact) return { ok: false, error: "Contact not found." };

  await prisma.activityEvent.update({
    where: { id: activityId },
    data: { type, date, notes: notes || null },
  });

  await syncContactInteraction(contact.id);
  revalidate(slug);
  return { ok: true };
}

export async function deleteActivityAction(
  slug: string,
  activityId: number,
): Promise<ActivityActionResult> {
  const contact = await prisma.contact.findUnique({ where: { slug } });
  if (!contact) return { ok: false, error: "Contact not found." };

  await prisma.activityEvent.delete({ where: { id: activityId } });

  await syncContactInteraction(contact.id);
  revalidate(slug);
  return { ok: true };
}
