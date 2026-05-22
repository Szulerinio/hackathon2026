"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";

export type MemberActionResult = { ok: true } | { ok: false; error: string };

function revalidate(slug: string) {
  revalidatePath(`/contacts/${slug}`);
  revalidatePath("/contacts");
  revalidatePath("/");
}

export async function addMemberAction(
  slug: string,
  formData: FormData,
): Promise<MemberActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { ok: false, error: "Name is required (at least 2 characters)." };
  }

  const contact = await prisma.contact.findUnique({ where: { slug } });
  if (!contact) return { ok: false, error: "Contact not found." };

  await prisma.householdMember.create({
    data: {
      contactId: contact.id,
      name,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      role: String(formData.get("role") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });

  revalidate(slug);
  return { ok: true };
}

export async function updateMemberAction(
  slug: string,
  memberId: number,
  formData: FormData,
): Promise<MemberActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { ok: false, error: "Name is required (at least 2 characters)." };
  }

  await prisma.householdMember.update({
    where: { id: memberId },
    data: {
      name,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      role: String(formData.get("role") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });

  revalidate(slug);
  return { ok: true };
}

export async function deleteMemberAction(
  slug: string,
  memberId: number,
): Promise<MemberActionResult> {
  await prisma.householdMember.delete({ where: { id: memberId } });
  revalidate(slug);
  return { ok: true };
}
