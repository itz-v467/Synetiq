export function formatApiError(detail: unknown, fallback = "Request failed"): string {
  if (detail == null) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) return String((item as { msg: string }).msg);
        return JSON.stringify(item);
      })
      .join("; ");
  }
  if (typeof detail === "object" && "message" in detail) {
    return String((detail as { message: string }).message);
  }
  return fallback;
}

export async function readApiError(res: Response, fallback?: string): Promise<string> {
  try {
    const data = await res.json();
    return formatApiError(data?.detail ?? data?.message, fallback ?? `Error ${res.status}`);
  } catch {
    return fallback ?? `Error ${res.status}`;
  }
}
