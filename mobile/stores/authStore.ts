/**
 * Mobile auth store — login, logout, token management via expo-secure-store.
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../services/apiClient';

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  store_id: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post('/auth/token/', { email, password });
      await SecureStore.setItemAsync('access_token', data.access);
      await SecureStore.setItemAsync('refresh_token', data.refresh);

      // Decode user from JWT payload
      const payload = JSON.parse(atob(data.access.split('.')[1]));
      const user: User = {
        id: payload.user_id,
        email: payload.email || email,
        username: payload.username || '',
        full_name: payload.full_name || '',
        role: payload.role || '',
        store_id: payload.store_id || '',
      };

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Login failed';
      set({ error: message, isLoading: false });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      // Check if token is expired
      if (payload.exp * 1000 < Date.now()) {
        // Try refresh
        const refresh = await SecureStore.getItemAsync('refresh_token');
        if (!refresh) {
          set({ isLoading: false });
          return;
        }
        try {
          const { data } = await apiClient.post('/auth/token/refresh/', { refresh });
          await SecureStore.setItemAsync('access_token', data.access);
          if (data.refresh) {
            await SecureStore.setItemAsync('refresh_token', data.refresh);
          }
          const newPayload = JSON.parse(atob(data.access.split('.')[1]));
          set({
            user: {
              id: newPayload.user_id,
              email: newPayload.email || '',
              username: newPayload.username || '',
              full_name: newPayload.full_name || '',
              role: newPayload.role || '',
              store_id: newPayload.store_id || '',
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
        }
        return;
      }

      set({
        user: {
          id: payload.user_id,
          email: payload.email || '',
          username: payload.username || '',
          full_name: payload.full_name || '',
          role: payload.role || '',
          store_id: payload.store_id || '',
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
