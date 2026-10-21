// Minimal JSON client for the Laravel session endpoints. Laravel sets an
// XSRF-TOKEN cookie on every response; echoing it back as X-XSRF-TOKEN keeps
// CSRF protection working even after the session is regenerated on login.

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

function xsrfToken(): string | undefined {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function api<T>(path: string, options: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
  const token = xsrfToken();
  if (token) headers["X-XSRF-TOKEN"] = token;
  // Multipart uploads let the browser set the boundary, so no Content-Type here.
  if (options.body !== undefined && !options.form) headers["Content-Type"] = "application/json";

  const res = await fetch(path, {
    method: options.method ?? "GET",
    headers,
    credentials: "same-origin",
    body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      res.status === 429
        ? "Too many attempts. Please wait a minute and try again."
        : (data.message as string | undefined) ?? "Something went wrong. Please try again.";
    throw new ApiError(message, res.status, data.errors ?? {});
  }
  return data as T;
}
