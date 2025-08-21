import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@shared/schema';
import { apiRequest } from '@/lib/api';
import { setAuthToken, removeAuthToken } from '@/lib/authUtils';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: 'fan' | 'artist') => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiRequest('POST', '/api/auth/login', {
            email,
            password,
          });
          
          const { user, token } = await response.json();
          setAuthToken(token);
          set({ user, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Login failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      register: async (email: string, password: string, name: string, role: 'fan' | 'artist' = 'fan') => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiRequest('POST', '/api/auth/register', {
            email,
            password,
            name,
            role,
          });
          
          const { user, token } = await response.json();
          setAuthToken(token);
          set({ user, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Registration failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      logout: () => {
        removeAuthToken();
        set({ user: null, error: null });
      },

      clearError: () => {
        set({ error: null });
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
