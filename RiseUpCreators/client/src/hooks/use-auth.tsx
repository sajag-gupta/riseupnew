import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { authApi, redirectAfterAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import type { CurrentUser, AuthState, LoginForm, SignupForm } from "@/types";

interface AuthContextType extends AuthState {
  login: (credentials: LoginForm) => Promise<void>;
  signup: (userData: SignupForm) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<CurrentUser>) => Promise<void>;
  updateUser: (user: CurrentUser) => void;
  followArtist: (artistId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = authApi.getStoredToken();
    const user = authApi.getStoredUser();
    
    setAuthState({
      user,
      token,
      isLoading: false,
    });
  }, []);

  // Get current user query
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/users/me"],
    enabled: !!authState.token && !authState.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update auth state when user data changes
  useEffect(() => {
    if (currentUser) {
      setAuthState(prev => ({
        ...prev,
        user: currentUser as CurrentUser,
        isLoading: false,
      }));
    }
  }, [currentUser]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuthState({
        user: data.user,
        token: data.token,
        isLoading: false,
      });
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user.name}`,
      });
      redirectAfterAuth(data.user);
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: (data) => {
      setAuthState({
        user: data.user,
        token: data.token,
        isLoading: false,
      });
      toast({
        title: "Welcome to Rise Up Creators!",
        description: `Account created successfully for ${data.user.name}`,
      });
      redirectAfterAuth(data.user);
    },
    onError: (error: any) => {
      toast({
        title: "Signup failed",
        description: error.message || "Please try again with different details.",
        variant: "destructive",
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (user) => {
      setAuthState(prev => ({
        ...prev,
        user,
      }));
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  // Follow artist mutation
  const followArtistMutation = useMutation({
    mutationFn: authApi.followArtist,
    onSuccess: (data, artistId) => {
      // Update user's following list
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? {
          ...prev.user,
          following: data.following 
            ? [...(prev.user.following || []), artistId]
            : (prev.user.following || []).filter(id => id !== artistId)
        } : null,
      }));
      
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      
      toast({
        title: data.following ? "Following!" : "Unfollowed",
        description: data.following 
          ? "You're now following this artist" 
          : "You unfollowed this artist",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Action failed",
        description: error.message || "Failed to follow/unfollow artist.",
        variant: "destructive",
      });
    },
  });

  const login = async (credentials: LoginForm) => {
    await loginMutation.mutateAsync(credentials);
  };

  const signup = async (userData: SignupForm) => {
    if (userData.password !== userData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    await signupMutation.mutateAsync(userData);
  };

  const logout = () => {
    authApi.logout();
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
    });
    queryClient.clear();
    navigate("/");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  const updateProfile = async (updates: Partial<CurrentUser>) => {
    await updateProfileMutation.mutateAsync(updates);
  };

  const updateUser = (user: CurrentUser) => {
    setAuthState(prev => ({
      ...prev,
      user,
    }));
    
    // Update localStorage to keep it in sync with the same key used in auth.ts
    localStorage.setItem("ruc_user_data", JSON.stringify(user));
  };

  const followArtist = async (artistId: string) => {
    await followArtistMutation.mutateAsync(artistId);
  };

  const contextValue: AuthContextType = {
    ...authState,
    isLoading: authState.isLoading || userLoading || 
               loginMutation.isPending || signupMutation.isPending,
    login,
    signup,
    logout,
    updateProfile,
    updateUser,
    followArtist,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Auth guard hooks
export function useRequireAuth() {
  const auth = useAuth();
  
  useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      window.location.href = "/login";
    }
  }, [auth.isLoading, auth.user]);
  
  return auth;
}

export function useRequireRole(requiredRole: string) {
  const auth = useAuth();
  
  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.user) {
        window.location.href = "/login";
      } else if (auth.user.role !== requiredRole) {
        // Redirect to appropriate dashboard
        redirectAfterAuth(auth.user);
      }
    }
  }, [auth.isLoading, auth.user, requiredRole]);
  
  return auth;
}
