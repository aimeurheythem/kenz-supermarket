import { create } from "zustand";
import apiClient from "@/services/apiClient";
import type { AppSetting } from "@/types/entities";

interface SettingsState {
  settings: AppSetting[];
  isLoading: boolean;
  error: string | null;

  fetchSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: [],
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<AppSetting[]>("/settings/");
      set({ settings: data });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || "Failed to fetch settings" });
    } finally {
      set({ isLoading: false });
    }
  },

  updateSetting: async (key, value) => {
    const { data } = await apiClient.put<AppSetting>(`/settings/${key}/`, { key, value });
    set((s) => ({
      settings: s.settings.some((st) => st.key === key)
        ? s.settings.map((st) => (st.key === key ? data : st))
        : [...s.settings, data],
    }));
  },
}));
