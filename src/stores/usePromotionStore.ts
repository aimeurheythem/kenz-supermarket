import { create } from 'zustand';
import { toast } from 'sonner';
import type { Promotion, PromotionInput } from '@/lib/types';
import { PromotionRepo } from '../../database/repositories/promotion.repo';

interface PromotionFilters {
    type?: string;
    status?: string;
    search?: string;
}

interface PromotionStore {
    // Data
    promotions: Promotion[];
    isLoading: boolean;
    error: string | null;

    // Actions — CRUD
    clearError: () => void;
    loadPromotions: (filters?: PromotionFilters) => Promise<void>;
    addPromotion: (input: PromotionInput) => Promise<Promotion>;
    updatePromotion: (id: number, input: Partial<PromotionInput>) => Promise<Promotion>;
    deletePromotion: (id: number) => Promise<void>;
    getPromotionById: (id: number) => Promise<Promotion | undefined>;
}

export const usePromotionStore = create<PromotionStore>((set, get) => ({
    promotions: [],
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    loadPromotions: async (filters?: PromotionFilters) => {
        try {
            set({ isLoading: true, error: null });
            const promotions = await PromotionRepo.getAll(filters);
            set({ promotions });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },

    addPromotion: async (input: PromotionInput) => {
        try {
            set({ error: null });
            const promotion = await PromotionRepo.create(input);
            await get().loadPromotions();
            toast.success('Promotion created successfully');
            return promotion;
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    updatePromotion: async (id: number, input: Partial<PromotionInput>) => {
        try {
            set({ error: null });
            const promotion = await PromotionRepo.update(id, input);
            await get().loadPromotions();
            toast.success('Promotion updated successfully');
            return promotion;
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    deletePromotion: async (id: number) => {
        try {
            set({ error: null });
            await PromotionRepo.delete(id);
            await get().loadPromotions();
            toast.success('Promotion deleted successfully');
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    getPromotionById: async (id: number) => {
        try {
            return await PromotionRepo.getById(id);
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },
}));
