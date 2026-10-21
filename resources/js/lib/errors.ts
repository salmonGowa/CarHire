import { ApiError } from "@/lib/api";

/** Flatten an API error into { field: firstMessage }, with `form` for non-field errors. */
export function fieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof ApiError)) return { form: "Couldn't reach the server. Please try again." };
  const fields = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]]));
  return Object.keys(fields).length ? fields : { form: err.message };
}

/** One human message for an API error. */
export function errorMessage(err: unknown): string {
  const e = fieldErrors(err);
  return Object.values(e)[0];
}
