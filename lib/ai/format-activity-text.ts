/** Text passed to alert extraction after logging an activity. */
export function formatActivityForAlertExtraction(input: {
  contactName: string;
  type: string;
  date: string;
  notes?: string | null;
}): string {
  const lines = [
    `New activity logged for ${input.contactName}.`,
    `Type: ${input.type}`,
    `Date: ${input.date}`,
  ];
  const noteText = input.notes?.trim();
  lines.push(noteText ? `Notes: ${noteText}` : "Notes: (none)");
  return lines.join("\n");
}
