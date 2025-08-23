// src/hooks/useAuth.ts
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { useLocation } from "wouter";

const PUBLIC_ROUTES = new Set<string>(["/", "/login", "/register"]);

function hasAuthCookie(name = "token") {
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${name}=`));
}

export function useAuth() {
  const [location] = useLocation();
  const isPublic = PUBLIC_ROUTES.has(location);
  const enabled = !isPublic && hasAuthCookie(); // <-- no cookie => no fetch

  const q = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn<User>({ on401: "returnNull" }), // 401 => null
    enabled,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  return {
    user: q.data ?? null,
    isLoading: q.isLoading,
    isAuthenticated: !!q.data,
    error: q.error,
    refetch: q.refetch,
  };
}
