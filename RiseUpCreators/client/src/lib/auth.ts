import { apiRequest } from "./queryClient";
import { STORAGE_KEYS } from "./constants";
import type { CurrentUser, LoginForm, SignupForm } from "../types";

export interface AuthResponse {
  user: CurrentUser;
  token: string;
}

export const authApi = {
  login: async (credentials: LoginForm): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    const data = await response.json();
    
    // Store auth data
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
    
    return data;
  },

  signup: async (userData: SignupForm): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/signup", {
      name: userData.name,
      email: userData.email,
      passwordHash: userData.password,
      role: userData.role
    });
    const data = await response.json();
    
    // Store auth data
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
    
    return data;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiRequest("POST", "/api/auth/forgot-password", { email });
    return response.json();
  },

  getCurrentUser: async (): Promise<CurrentUser> => {
    const response = await apiRequest("GET", "/api/users/me");
    const user = await response.json();
    
    // Update stored user data
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    
    return user;
  },

  getStoredToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  getStoredUser: (): CurrentUser | null => {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const user = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return !!(token && user);
  },

  hasRole: (role: string): boolean => {
    const user = authApi.getStoredUser();
    return user?.role === role;
  },

  updateProfile: async (updates: Partial<CurrentUser>): Promise<CurrentUser> => {
    const response = await apiRequest("PATCH", "/api/users/me", updates);
    const user = await response.json();
    
    // Update stored user data
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    
    return user;
  },

  followArtist: async (artistId: string): Promise<{ following: boolean }> => {
    const response = await apiRequest("POST", `/api/users/follow/${artistId}`);
    return response.json();
  }
};

// Auth helper functions
export const getAuthHeaders = (): Record<string, string> => {
  const token = authApi.getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const requireAuth = () => {
  if (!authApi.isAuthenticated()) {
    window.location.href = "/login";
    return false;
  }
  return true;
};

export const requireRole = (requiredRole: string) => {
  if (!authApi.isAuthenticated()) {
    window.location.href = "/login";
    return false;
  }
  
  if (!authApi.hasRole(requiredRole)) {
    // Redirect to appropriate dashboard based on role
    const user = authApi.getStoredUser();
    if (user?.role === "artist") {
      window.location.href = "/creator";
    } else if (user?.role === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/dashboard";
    }
    return false;
  }
  
  return true;
};

export const redirectAfterAuth = (user: CurrentUser) => {
  // Redirect to appropriate dashboard based on role
  switch (user.role) {
    case "artist":
      window.location.href = "/creator";
      break;
    case "admin":
      window.location.href = "/admin";
      break;
    case "fan":
      window.location.href = "/home";
      break;
    default:
      window.location.href = "/";
  }
};
