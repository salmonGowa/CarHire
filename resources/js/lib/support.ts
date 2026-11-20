/** Build a multipart body for ticket endpoints (fields plus up to 5 attachments). */
export function ticketForm(fields: Record<string, string | number | boolean | null | undefined>, files: File[]): FormData {
  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    if (v === null || v === undefined || v === "") return;
    form.append(k, typeof v === "boolean" ? (v ? "1" : "0") : String(v));
  });
  files.forEach((f) => form.append("attachments[]", f));
  return form;
}

/** Pull "attachments.0" style errors into one message. */
export function attachmentError(errors: Record<string, string>): string | undefined {
  return errors.attachments ?? Object.entries(errors).find(([k]) => k.startsWith("attachments."))?.[1];
}
