/** Text passed to alert extraction after logging or editing an activity. */
export function formatActivityForAlertExtraction(input: {
  contactName: string;
  type: string;
  date: string;
  notes?: string | null;
  /** @default "create" */
  mode?: "create" | "edit";
}): string {
  const headline =
    input.mode === "edit"
      ? `Activity updated for ${input.contactName}.`
      : `New activity logged for ${input.contactName}.`;
  const lines = [
    headline,
    `Type: ${input.type}`,
    `Date: ${input.date}`,
  ];
  const noteText = input.notes?.trim();
  lines.push(noteText ? `Notes: ${noteText}` : "Notes: (none)");
  return lines.join("\n");
}
