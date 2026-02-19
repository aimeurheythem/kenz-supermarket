import { create } from 'zustand';
import { AuditLogRepo } from '../../database/repositories/audit-log.repo';
import type { AuditLog, AuditLogFilters } from '../../database/repositories/audit-log.repo';

export type { AuditLog, AuditLogFilters };

interface AuditLogStore {
    logs: AuditLog[];
    total: number;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
    loadLogs: (filters?: AuditLogFilters) => Promise<void>;
}

export const useAuditLogStore = create<AuditLogStore>((set) => ({
    logs: [],
    total: 0,
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    loadLogs: async (filters) => {
        try {
            set({ isLoading: true, error: null });
            const result = await AuditLogRepo.getLogs(filters);
            set({ logs: result.logs, total: result.total });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },
}));
