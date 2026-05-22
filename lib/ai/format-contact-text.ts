/** Text passed to alert extraction after contact notes/context create or edit. */
export function formatContactFieldsForAlertExtraction(input: {
  contactName: string;
  context?: string | null;
  notes?: string | null;
  /** @default "edit" */
  mode?: "create" | "edit";
}): string {
  const headline =
    input.mode === "create"
      ? `New contact added: ${input.contactName}.`
      : `Contact record updated for ${input.contactName}.`;
  const lines = [headline];
  const contextText = input.context?.trim();
  const notesText = input.notes?.trim();
  lines.push(contextText ? `Context: ${contextText}` : "Context: (none)");
  lines.push(
    notesText ? `Open items & notes: ${notesText}` : "Open items & notes: (none)",
  );
  return lines.join("\n");
}
