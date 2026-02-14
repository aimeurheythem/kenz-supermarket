import { create } from 'zustand';

interface SystemState {
    isLanguageSwitching: boolean;
    setLanguageSwitching: (isSwitching: boolean) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
    isLanguageSwitching: false,
    setLanguageSwitching: (isSwitching) => set({ isLanguageSwitching: isSwitching }),
}));
