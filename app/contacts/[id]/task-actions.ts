"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";

export type TaskActionResult = { ok: true } | { ok: false; error: string };

function revalidate(slug: string) {
  revalidatePath(`/contacts/${slug}`);
  revalidatePath("/");
}

export async function createTaskAction(
  slug: string,
  formData: FormData,
): Promise<TaskActionResult> {
  const title = String(formData.get("title") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!title) return { ok: false, error: "Title is required." };
  if (!dueDate) return { ok: false, error: "Due date is required." };

  const contact = await prisma.contact.findUnique({ where: { slug } });
  if (!contact) return { ok: false, error: "Contact not found." };

  await prisma.alert.create({
    data: {
      contactId: contact.id,
      reason: title,
      suggestedAction: notes || null,
      severity: "watch",
      dueDate,
      source: "manual",
      done: false,
      isActive: true,
    },
  });

  revalidate(slug);
  return { ok: true };
}

export async function toggleTaskAction(
  slug: string,
  taskId: number,
  done: boolean,
): Promise<TaskActionResult> {
  await prisma.alert.update({
    where: { id: taskId },
    data: {
      done,
      doneAt: done ? new Date() : null,
      isActive: !done,
    },
  });

  revalidate(slug);
  return { ok: true };
}

export async function deleteTaskAction(
  slug: string,
  taskId: number,
): Promise<TaskActionResult> {
  await prisma.alert.delete({ where: { id: taskId } });
  revalidate(slug);
  return { ok: true };
}

export async function updateTaskAction(
  slug: string,
  taskId: number,
  formData: FormData,
): Promise<TaskActionResult> {
  const title = String(formData.get("title") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!title) return { ok: false, error: "Title is required." };
  if (!dueDate) return { ok: false, error: "Due date is required." };

  await prisma.alert.update({
    where: { id: taskId },
    data: { reason: title, dueDate, suggestedAction: notes || null },
  });

  revalidate(slug);
  return { ok: true };
}
