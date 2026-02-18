import { create } from 'zustand';
import { SettingsRepo, type AppSettings } from '../../database/repositories/settings.repo';

interface SettingsStore {
    settings: AppSettings;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
    loadSettings: () => Promise<void>;
    updateSetting: (key: string, value: string) => Promise<void>;
    updateSettings: (newSettings: AppSettings) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
    settings: {},
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    loadSettings: async () => {
        try {
            set({ isLoading: true, error: null });
            const settings = await SettingsRepo.getAll();
            set({ settings });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },

    updateSetting: async (key, value) => {
        const previousSettings = { ...get().settings };
        try {
            set({ error: null });
            // Optimistic update
            set(state => ({
                settings: { ...state.settings, [key]: value }
            }));
            await SettingsRepo.set(key, value);
        } catch (e) {
            // Rollback on failure
            set({ settings: previousSettings, error: (e as Error).message });
            throw e;
        }
    },

    updateSettings: async (newSettings) => {
        const previousSettings = { ...get().settings };
        try {
            set({ error: null });
            // Optimistic update
            set(state => ({
                settings: { ...state.settings, ...newSettings }
            }));
            await SettingsRepo.setMany(newSettings);
        } catch (e) {
            // Rollback on failure
            set({ settings: previousSettings, error: (e as Error).message });
            throw e;
        }
    },
}));

/** Standalone selector — use as `useSettingsStore(selectSetting('key', 'default'))` */
export const selectSetting = (key: string, defaultValue = '') =>
    (state: SettingsStore) => state.settings[key] ?? defaultValue;

/** Direct getter for non-reactive access — use as `getSetting('key', 'default')` */
export const getSetting = (key: string, defaultValue = '') =>
    useSettingsStore.getState().settings[key] ?? defaultValue;

