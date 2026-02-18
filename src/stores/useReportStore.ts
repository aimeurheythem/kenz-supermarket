import { create } from 'zustand';
import { ReportRepo, type SalesChartData, type TopProductData, type CashierPerformanceData, type CashierDailyPerformance, type SessionReport } from '../../database/repositories/report.repo';
import { SaleRepo } from '../../database/repositories/sale.repo';
import type { Sale } from '../lib/types';

interface ReportStore {
    salesData: SalesChartData[];
    topProducts: TopProductData[];
    categoryData: { name: string; value: number }[];
    cashierPerformance: CashierPerformanceData[];
    cashierDailyPerformance: CashierDailyPerformance[];
    sessionReports: SessionReport[];
    salesList: Sale[];
    period: 'today' | '7days' | '30days' | 'year';
    selectedCashier: number | null;
    isLoadingReports: boolean;
    isLoadingCashier: boolean;
    isLoadingSales: boolean;
    error: string | null;
    clearError: () => void;
    setPeriod: (period: 'today' | '7days' | '30days' | 'year') => Promise<void>;
    setSelectedCashier: (cashierId: number | null) => Promise<void>;
    loadReports: () => Promise<void>;
    loadCashierReports: () => Promise<void>;
    loadSales: () => Promise<void>;
    refundSale: (saleId: number, reason?: string) => Promise<void>;
    voidSale: (saleId: number, reason?: string) => Promise<void>;
}

export const useReportStore = create<ReportStore>((set, get) => ({
    salesData: [],
    topProducts: [],
    categoryData: [],
    cashierPerformance: [],
    cashierDailyPerformance: [],
    sessionReports: [],
    salesList: [],
    period: 'today',
    selectedCashier: null,
    isLoadingReports: false,
    isLoadingCashier: false,
    isLoadingSales: false,
    error: null,

    clearError: () => set({ error: null }),

    setPeriod: async (period) => {
        set({ period });
        await Promise.all([
            get().loadReports(),
            get().loadCashierReports(),
            get().loadSales(),
        ]);
    },

    setSelectedCashier: async (cashierId) => {
        set({ selectedCashier: cashierId });
        await Promise.all([
            get().loadCashierReports(),
            get().loadSales(),
        ]);
    },

    loadReports: async () => {
        try {
            set({ isLoadingReports: true, error: null });
            const { period } = get();
            const salesData = await ReportRepo.getSalesChart(period);
            const topProducts = await ReportRepo.getTopProducts(10);
            const categoryData = await ReportRepo.getCategoryPerformance();
            set({ salesData, topProducts, categoryData });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoadingReports: false });
        }
    },

    loadCashierReports: async () => {
        try {
            set({ isLoadingCashier: true, error: null });
            const { period, selectedCashier } = get();
            const cashierPerformance = await ReportRepo.getCashierPerformance(period, selectedCashier || undefined);
            const cashierDailyPerformance = await ReportRepo.getCashierDailyPerformance(period, selectedCashier || undefined);
            const sessionReports = await ReportRepo.getSessionReports(period, selectedCashier || undefined);
            set({ cashierPerformance, cashierDailyPerformance, sessionReports });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoadingCashier: false });
        }
    },

    loadSales: async () => {
        try {
            set({ isLoadingSales: true, error: null });
            const { period } = get();
            const now = new Date();
            const past = new Date();
            if (period === 'today') past.setHours(0, 0, 0, 0);
            else if (period === '7days') past.setDate(now.getDate() - 7);
            else if (period === '30days') past.setDate(now.getDate() - 30);
            else if (period === 'year') past.setFullYear(now.getFullYear() - 1);

            const filters = {
                from: past.toISOString(),
                to: now.toISOString(),
                limit: 100
            };

            const salesList = await SaleRepo.getAll(filters);
            set({ salesList });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoadingSales: false });
        }
    },

    refundSale: async (saleId, reason) => {
        try {
            set({ error: null });
            await SaleRepo.refundSale(saleId, reason);
            get().loadSales();
            get().loadReports();
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    voidSale: async (saleId, reason) => {
        try {
            set({ error: null });
            await SaleRepo.voidSale(saleId, reason);
            get().loadSales();
            get().loadReports();
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    }
}));

