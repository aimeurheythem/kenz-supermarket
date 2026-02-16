import { create } from 'zustand';
import { SettingsRepo, type AppSettings } from '../../database/repositories/settings.repo';

interface SettingsStore {
    settings: AppSettings;
    isLoading: boolean;
    loadSettings: () => Promise<void>;
    updateSetting: (key: string, value: string) => Promise<void>;
    updateSettings: (newSettings: AppSettings) => Promise<void>;
    getSetting: (key: string, defaultValue?: string) => string;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
    settings: {}, // Initialize with empty object, will be populated on load
    isLoading: false,

    loadSettings: async () => {
        set({ isLoading: true });
        try {
            const settings = await SettingsRepo.getAll();
            // Merge with existing state to avoid wiping optimistic updates if any
            // But usually meaningful defaults should be handled by getSetting
            set({ settings, isLoading: false });
        } catch (error) {
            console.error('Failed to load settings:', error);
            set({ isLoading: false });
        }
    },

    updateSetting: async (key, value) => {
        // Optimistic update
        set(state => ({
            settings: { ...state.settings, [key]: value }
        }));
        await SettingsRepo.set(key, value);
    },

    updateSettings: async (newSettings) => {
        // Optimistic update
        set(state => ({
            settings: { ...state.settings, ...newSettings }
        }));
        await SettingsRepo.setMany(newSettings);
    },

    getSetting: (key, defaultValue = '') => {
        return get().settings[key] ?? defaultValue;
    }
}));
