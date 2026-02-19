import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutState {
    isSidebarCollapsed: boolean;
    isLanguageSwitching: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    toggleSidebar: () => void;
    setLanguageSwitching: (isSwitching: boolean) => void;
}

export const useLayoutStore = create<LayoutState>()(
    persist(
        (set) => ({
            isSidebarCollapsed: false,
            isLanguageSwitching: false,
            setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
            toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
            setLanguageSwitching: (isSwitching) => set({ isLanguageSwitching: isSwitching }),
        }),
        {
            name: 'supermarket-layout-storage',
            partialize: (state) => ({
                isSidebarCollapsed: state.isSidebarCollapsed,
            }),
        },
    ),
);
