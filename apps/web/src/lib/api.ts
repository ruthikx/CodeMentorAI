const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getBrowserToken();
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;

    try {
      const payload = (await response.json()) as { error?: string; detail?: string };
      message = payload.error ?? payload.detail ?? message;
    } catch {
      // Leave the default message intact when the response is not JSON.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function buildAuthHeaders(headers?: HeadersInit): HeadersInit {
  const token = getBrowserToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers ?? {})
  };
}

function getBrowserToken(): string | null {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_TOKEN ?? null;
  }

  return window.localStorage.getItem("codementor_token") ?? process.env.NEXT_PUBLIC_API_TOKEN ?? null;
}
