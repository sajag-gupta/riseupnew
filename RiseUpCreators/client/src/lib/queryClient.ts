// src/lib/queryClient.ts
import { QueryClient, type QueryFunction } from "@tanstack/react-query";

function toUrlFromQueryKey(queryKey: readonly unknown[]): string {
  // Accepts: ['/api/auth/me']  OR  ['api','auth','me']
  const first = queryKey[0];
  if (typeof first === "string" && first.startsWith("/")) return first;
  return "/" + queryKey.map(String).join("/");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch with exponential backoff and 429 Retry-After support.
 * - Retries: 2 (total 3 attempts)
 * - Respects server's Retry-After (seconds) when present
 */
async function fetchWithBackoff(
  input: RequestInfo | URL,
  init?: RequestInit,
  { retries = 2, baseDelay = 500 }: { retries?: number; baseDelay?: number } = {},
): Promise<Response> {
  let attempt = 0;
  // attach credentials by default
  const finalInit: RequestInit = { credentials: "include", ...(init || {}) };

  while (true) {
    const res = await fetch(input, finalInit);

    if (res.status !== 429 && res.ok) return res;

    // 401/4xx other than 429: return immediately (caller decides)
    if (res.status !== 429 && !res.ok) return res;

    // 429: backoff (respect Retry-After if present)
    if (attempt >= retries) return res;
    attempt++;

    const retryAfter = res.headers.get("Retry-After");
    const retryMs = retryAfter ? Number(retryAfter) * 1000 : baseDelay * 2 ** (attempt - 1);
    await sleep(retryMs);
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(method: string, url: string, data?: unknown): Promise<Response> {
  const res = await fetchWithBackoff(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn =
  <T>(options: { on401: UnauthorizedBehavior }): QueryFunction<T | null> =>
  async ({ queryKey, signal }) => {
    const url = toUrlFromQueryKey(queryKey);

    const res = await fetchWithBackoff(url, { signal, credentials: "include" });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return (await res.json()) as T;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      // keep dev quiet – no surprise refetching
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      refetchInterval: false,
      // small but useful cache window
      staleTime: 60_000, // 1 minute
      gcTime: 10 * 60_000, // 10 minutes
      // retry a couple times with internal backoff for transient errors
      retry: (failureCount, error: any) => {
        // do not retry on 401/403/404; do for 429/5xx
        const msg = String(error?.message ?? "");
        if (/^(401|403|404):/.test(msg)) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
    mutations: {
      retry: false,
    },
  },
});
