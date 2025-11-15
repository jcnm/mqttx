/**
 * Authentication Store
 * Manages authentication state with Zustand
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { authService, type User } from '../services/authService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  immer((set) => ({
    user: null,
    isLoading: false,
    error: null,

    login: async (username, password) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const authToken = await authService.login(username, password);
        set((state) => {
          state.user = authToken.user;
          state.isLoading = false;
        });
      } catch (err) {
        set((state) => {
          state.error = (err as Error).message;
          state.isLoading = false;
        });
        throw err;
      }
    },

    logout: () => {
      authService.logout();
      set((state) => {
        state.user = null;
        state.error = null;
      });
    },

    checkAuth: () => {
      const user = authService.getCurrentUser();
      set((state) => {
        state.user = user;
      });
    },

    hasPermission: (permission) => {
      return authService.hasPermission(permission);
    },
  }))
);
