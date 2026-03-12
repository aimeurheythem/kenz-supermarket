import { create } from "zustand";
import apiClient from "@/services/apiClient";
import type { PaginatedResponse } from "@/types/entities";

interface CrudState<T> {
  items: T[];
  total: number;
  isLoading: boolean;
  error: string | null;

  fetchAll: (params?: Record<string, string | number | undefined>) => Promise<void>;
  fetchOne: (id: string) => Promise<T>;
  createItem: (data: Partial<T>) => Promise<T>;
  updateItem: (id: string, data: Partial<T>) => Promise<T>;
  deleteItem: (id: string) => Promise<void>;
  setItems: (items: T[]) => void;
  updateLocalItem: (id: string, data: Partial<T>) => void;
  removeLocalItem: (id: string) => void;
}

export function createApiStore<T extends { id: string }>(endpoint: string) {
  return create<CrudState<T>>((set, get) => ({
    items: [],
    total: 0,
    isLoading: false,
    error: null,

    fetchAll: async (params) => {
      set({ isLoading: true, error: null });
      try {
        const { data } = await apiClient.get<PaginatedResponse<T>>(endpoint, { params });
        set({ items: data.results, total: data.count });
      } catch (err: any) {
        set({ error: err.response?.data?.detail || "Failed to fetch" });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchOne: async (id) => {
      const { data } = await apiClient.get<T>(`${endpoint}${id}/`);
      return data;
    },

    createItem: async (payload) => {
      const { data } = await apiClient.post<T>(endpoint, payload);
      set((s) => ({ items: [data, ...s.items], total: s.total + 1 }));
      return data;
    },

    updateItem: async (id, payload) => {
      const { data } = await apiClient.patch<T>(`${endpoint}${id}/`, payload);
      set((s) => ({ items: s.items.map((i) => (i.id === id ? data : i)) }));
      return data;
    },

    deleteItem: async (id) => {
      await apiClient.delete(`${endpoint}${id}/`);
      set((s) => ({ items: s.items.filter((i) => i.id !== id), total: s.total - 1 }));
    },

    setItems: (items) => set({ items }),

    updateLocalItem: (id, data) =>
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i)),
      })),

    removeLocalItem: (id) =>
      set((s) => ({
        items: s.items.filter((i) => i.id !== id),
        total: s.total - 1,
      })),
  }));
}
