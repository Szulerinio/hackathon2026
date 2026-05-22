"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
export type ActivityActionResult = { ok: true } | { ok: false; error: string };

async function syncDealLastActivity(dealId: number) {
  const latest = await prisma.activityEvent.findFirst({
    where: { dealId },
    orderBy: { date: "desc" },
  });
  await prisma.deal.update({
    where: { id: dealId },
    data: { lastActivityDate: latest?.date ?? null },
  });
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

function revalidateDeal(dealId: number, contactSlug?: string) {
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
  revalidatePath("/");
  if (contactSlug) {
    revalidatePath(`/contacts/${contactSlug}`);
    revalidatePath("/contacts");
  }
}

export async function createDealActivityAction(
  dealId: number,
  formData: FormData,
): Promise<ActivityActionResult> {
  const contactSlug = String(formData.get("contactSlug") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!contactSlug) return { ok: false, error: "Contact is required." };
  if (!type) return { ok: false, error: "Type is required." };
  if (!date) return { ok: false, error: "Date is required." };

  const contact = await prisma.contact.findUnique({ where: { slug: contactSlug } });
  if (!contact) return { ok: false, error: "Contact not found." };

  await prisma.activityEvent.create({
    data: { contactId: contact.id, dealId, type, date, notes: notes || null },
  });

  await syncDealLastActivity(dealId);
  await syncContactInteraction(contact.id);
  revalidateDeal(dealId, contactSlug);
  return { ok: true };
}

export async function updateDealActivityAction(
  dealId: number,
  activityId: number,
  formData: FormData,
): Promise<ActivityActionResult> {
  const type = String(formData.get("type") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!type) return { ok: false, error: "Type is required." };
  if (!date) return { ok: false, error: "Date is required." };

  const existing = await prisma.activityEvent.findUnique({
    where: { id: activityId },
    include: { contact: true },
  });
  if (!existing) return { ok: false, error: "Activity not found." };

  await prisma.activityEvent.update({
    where: { id: activityId },
    data: { type, date, notes: notes || null },
  });

  await syncDealLastActivity(dealId);
  await syncContactInteraction(existing.contactId);
  revalidateDeal(dealId, existing.contact.slug);
  return { ok: true };
}

export async function deleteDealActivityAction(
  dealId: number,
  activityId: number,
): Promise<ActivityActionResult> {
  const existing = await prisma.activityEvent.findUnique({
    where: { id: activityId },
    include: { contact: true },
  });
  if (!existing) return { ok: false, error: "Activity not found." };

  await prisma.activityEvent.delete({ where: { id: activityId } });

  await syncDealLastActivity(dealId);
  await syncContactInteraction(existing.contactId);
  revalidateDeal(dealId, existing.contact.slug);
  return { ok: true };
}
