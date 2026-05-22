"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";

export type ActivityActionResult = { ok: true } | { ok: false; error: string };

function revalidate(slug: string, dealId?: number) {
  revalidatePath(`/contacts/${slug}`);
  revalidatePath("/contacts");
  revalidatePath("/");
  if (dealId) {
    revalidatePath(`/deals/${dealId}`);
    revalidatePath("/deals");
  }
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

export async function createActivityAction(
  slug: string,
  formData: FormData,
): Promise<ActivityActionResult> {
  const type = String(formData.get("type") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const rawDealId = String(formData.get("dealId") ?? "").trim();
  const dealId = rawDealId ? Number(rawDealId) : undefined;

  if (!type) return { ok: false, error: "Type is required." };
  if (!date) return { ok: false, error: "Date is required." };

  const contact = await prisma.contact.findUnique({ where: { slug } });
  if (!contact) return { ok: false, error: "Contact not found." };

  await prisma.activityEvent.create({
    data: {
      contactId: contact.id,
      type,
      date,
      notes: notes || null,
      dealId: dealId ?? null,
    },
  });

  await syncContactInteraction(contact.id);
  if (dealId) await syncDealLastActivity(dealId);
  revalidate(slug, dealId);
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
  const rawDealId = String(formData.get("dealId") ?? "").trim();
  const dealId = rawDealId ? Number(rawDealId) : undefined;

  if (!type) return { ok: false, error: "Type is required." };
  if (!date) return { ok: false, error: "Date is required." };

  const contact = await prisma.contact.findUnique({ where: { slug } });
  if (!contact) return { ok: false, error: "Contact not found." };

  const existing = await prisma.activityEvent.findUnique({
    where: { id: activityId },
    select: { dealId: true },
  });
  const oldDealId = existing?.dealId ?? undefined;

  await prisma.activityEvent.update({
    where: { id: activityId },
    data: { type, date, notes: notes || null, dealId: dealId ?? null },
  });

  await syncContactInteraction(contact.id);
  if (oldDealId && oldDealId !== dealId) await syncDealLastActivity(oldDealId);
  if (dealId) await syncDealLastActivity(dealId);
  revalidate(slug, dealId);
  if (oldDealId && oldDealId !== dealId) {
    revalidatePath(`/deals/${oldDealId}`);
    revalidatePath("/deals");
  }
  return { ok: true };
}

export async function deleteActivityAction(
  slug: string,
  activityId: number,
): Promise<ActivityActionResult> {
  const contact = await prisma.contact.findUnique({ where: { slug } });
  if (!contact) return { ok: false, error: "Contact not found." };

  const existing = await prisma.activityEvent.findUnique({
    where: { id: activityId },
    select: { dealId: true },
  });
  const dealId = existing?.dealId ?? undefined;

  await prisma.activityEvent.delete({ where: { id: activityId } });

  await syncContactInteraction(contact.id);
  if (dealId) await syncDealLastActivity(dealId);
  revalidate(slug, dealId);
  return { ok: true };
}
