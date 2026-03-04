import { create } from 'zustand';
import type { AuthorizableAction, AuthorizationResult } from '@/lib/types';
import { UserRepo } from '../../database/repositories/user.repo';

interface AuthorizationStore {
    isOpen: boolean;
    action: AuthorizableAction | null;
    isVerifying: boolean;
    error: string | null;
    resolve: ((result: AuthorizationResult) => void) | null;

    requestAuth: (action: AuthorizableAction) => Promise<AuthorizationResult>;
    submitPin: (pin: string) => Promise<void>;
    cancel: () => void;
}

export const useAuthorizationStore = create<AuthorizationStore>((set, get) => ({
    isOpen: false,
    action: null,
    isVerifying: false,
    error: null,
    resolve: null,

    requestAuth: (action) => {
        return new Promise<AuthorizationResult>((resolve) => {
            set({
                isOpen: true,
                action,
                isVerifying: false,
                error: null,
                resolve,
            });
        });
    },

    submitPin: async (pin) => {
        const { resolve } = get();
        if (!resolve) return;

        set({ isVerifying: true, error: null });

        try {
            const manager = await UserRepo.verifyManagerPin(pin);
            if (manager) {
                const result: AuthorizationResult = {
                    authorized: true,
                    managerId: manager.id,
                    managerName: manager.full_name,
                };
                set({ isOpen: false, action: null, isVerifying: false, error: null, resolve: null });
                resolve(result);
            } else {
                set({ isVerifying: false, error: 'Invalid PIN. Please try again.' });
            }
        } catch {
            set({ isVerifying: false, error: 'Verification failed. Please try again.' });
        }
    },

    cancel: () => {
        const { resolve } = get();
        if (resolve) {
            resolve({ authorized: false, managerId: null, managerName: null });
        }
        set({ isOpen: false, action: null, isVerifying: false, error: null, resolve: null });
    },
}));
