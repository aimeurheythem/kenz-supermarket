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
    isLoading: boolean;
    setPeriod: (period: 'today' | '7days' | '30days' | 'year') => void;
    setSelectedCashier: (cashierId: number | null) => void;
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
    isLoading: false,

    setPeriod: (period) => {
        set({ period });
        get().loadReports();
        get().loadCashierReports();
        get().loadSales();
    },

    setSelectedCashier: (cashierId) => {
        set({ selectedCashier: cashierId });
        get().loadCashierReports();
        get().loadSales();
    },

    loadReports: async () => {
        set({ isLoading: true });
        const { period } = get();
        const salesData = await ReportRepo.getSalesChart(period);
        const topProducts = await ReportRepo.getTopProducts(10);
        const categoryData = await ReportRepo.getCategoryPerformance();

        set({ salesData, topProducts, categoryData, isLoading: false });
    },

    loadCashierReports: async () => {
        set({ isLoading: true });
        const { period, selectedCashier } = get();
        const cashierPerformance = await ReportRepo.getCashierPerformance(period, selectedCashier || undefined);
        const cashierDailyPerformance = await ReportRepo.getCashierDailyPerformance(period, selectedCashier || undefined);
        const sessionReports = await ReportRepo.getSessionReports(period, selectedCashier || undefined);

        set({ cashierPerformance, cashierDailyPerformance, sessionReports, isLoading: false });
    },

    loadSales: async () => {
        set({ isLoading: true });
        const { period, selectedCashier } = get();
        // Calculate date range based on period
        const now = new Date();
        const past = new Date();
        if (period === 'today') past.setHours(0, 0, 0, 0);
        else if (period === '7days') past.setDate(now.getDate() - 7);
        else if (period === '30days') past.setDate(now.getDate() - 30);
        else if (period === 'year') past.setFullYear(now.getFullYear() - 1);

        const filters = {
            from: past.toISOString(), // Include time for precise filtering
            to: now.toISOString(),     // Include time to capture sales up to now
            limit: 100 // Cap at 100 for now to avoid performance issues
        };

        const salesList = await SaleRepo.getAll(filters);
        // Client-side filter for cashier if needed, or update getSales to support filter
        // Currently getAll supports from/to/status/limit. It doesn't support user_id (cashier).
        // I should stick to DATE filtering for now.

        set({ salesList, isLoading: false });
    },

    refundSale: async (saleId, reason) => {
        await SaleRepo.refundSale(saleId, reason);
        get().loadSales();
        get().loadReports();
    },

    voidSale: async (saleId, reason) => {
        await SaleRepo.voidSale(saleId, reason);
        get().loadSales();
        get().loadReports();
    }
}));

