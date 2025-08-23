
// This file is deprecated - using useAuth hook instead
// Keeping this file to prevent import errors, but all functionality moved to useAuth hook

import { create } from 'zustand';
import type { User } from '@shared/schema';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Deprecated store - use useAuth hook instead
export const useAuthStore = create<AuthState>()(() => ({
  user: null,
  isLoading: false,
  error: null,
}));
