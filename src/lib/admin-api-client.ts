"use client";

export class AdminApiError extends Error {
  status: number;
  code?: string;
  requestId?: string;

  constructor(status: number, message: string, code?: string, requestId?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export async function adminApiFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? ((await res.json()) as Record<string, unknown>) : null;

  if (!res.ok) {
    const message =
      (payload?.message as string | undefined) ??
      (payload?.error as string | undefined) ??
      "Request failed";
    throw new AdminApiError(
      res.status,
      message,
      payload?.code as string | undefined,
      (payload?.requestId as string | undefined) ?? res.headers.get("x-request-id") ?? undefined
    );
  }

  return (payload as T) ?? ({} as T);
}

export function mapAdminApiError(error: unknown): string {
  if (!(error instanceof AdminApiError)) {
    return "Unexpected error. Please try again.";
  }

  if (error.status === 401) return "Session expired. Please log in again.";
  if (error.status === 403) return "Insufficient permission for this action.";
  if (error.status === 429) return "Rate limit reached. Please wait and retry.";
  return error.message;
}
