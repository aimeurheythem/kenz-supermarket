import { create } from "zustand";
import apiClient from "@/services/apiClient";
import wsClient from "@/services/wsClient";

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: "owner" | "manager" | "cashier";
  store_id: string;
  store_name: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    store_name: string;
    email: string;
    password: string;
    full_name: string;
    currency?: string;
    timezone?: string;
  }) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  logout: () => void;
  loadUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem("access_token"),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.post("/auth/token/", { email, password });
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      set({ user: data.user, isAuthenticated: true });
      wsClient.connect();
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (payload) => {
    set({ isLoading: true });
    try {
      await apiClient.post("/auth/register/", payload);
    } finally {
      set({ isLoading: false });
    }
  },

  verifyEmail: async (token) => {
    await apiClient.post("/auth/verify-email/", { token });
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    wsClient.disconnect();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      set({
        user: {
          id: payload.user_id,
          email: payload.email || "",
          full_name: payload.full_name || "",
          role: payload.role,
          store_id: payload.store_id,
          store_name: "",
        },
        isAuthenticated: true,
      });
      wsClient.connect();
    } catch {
      // invalid token
    }
  },
}));
