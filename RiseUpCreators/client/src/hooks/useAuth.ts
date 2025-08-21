import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/me");
        if (response.ok) {
          return await response.json();
        }
        return null;
      } catch (error) {
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
