
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/lib/authUtils";
import { useMemo } from "react";
import { useLocation } from "wouter";

const PUBLIC_ROUTES = new Set(["/", "/login", "/register"]);

export function useAuth() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const isPublicRoute = PUBLIC_ROUTES.has(location) || location.startsWith("/artist/");
  const hasToken = !!getAuthToken();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/me");
        return response.json();
      } catch (error: any) {
        if (error.status === 401) {
          removeAuthToken();
          return null;
        }
        throw error;
      }
    },
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("POST", "/api/auth/logout");
      } catch (error) {
        // Ignore logout API errors
      }
    },
    onSettled: () => {
      removeAuthToken();
      queryClient.clear();
      // Use replace instead of href to avoid full page reload
      window.history.replaceState(null, "", "/");
      window.location.reload();
    },
  });

  return useMemo(() => ({
    user: user || null,
    isLoading: isLoading && hasToken,
    error,
    isAuthenticated: !!user && hasToken,
    logout: () => logoutMutation.mutate(),
    refetch,
  }), [user, isLoading, error, hasToken, logoutMutation, refetch]);
}
