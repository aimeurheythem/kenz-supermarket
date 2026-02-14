import { create } from 'zustand';
import { ReportRepo, type SalesChartData, type TopProductData, type CashierPerformanceData, type CashierDailyPerformance, type SessionReport } from '../../database/repositories/report.repo';

interface ReportStore {
    salesData: SalesChartData[];
    topProducts: TopProductData[];
    categoryData: { name: string; value: number }[];
    cashierPerformance: CashierPerformanceData[];
    cashierDailyPerformance: CashierDailyPerformance[];
    sessionReports: SessionReport[];
    period: '7days' | '30days' | 'year';
    selectedCashier: number | null;
    setPeriod: (period: '7days' | '30days' | 'year') => void;
    setSelectedCashier: (cashierId: number | null) => void;
    loadReports: () => void;
    loadCashierReports: () => void;
}

export const useReportStore = create<ReportStore>((set, get) => ({
    salesData: [],
    topProducts: [],
    categoryData: [],
    cashierPerformance: [],
    cashierDailyPerformance: [],
    sessionReports: [],
    period: '7days',
    selectedCashier: null,

    setPeriod: (period) => {
        set({ period });
        get().loadReports();
        get().loadCashierReports();
    },

    setSelectedCashier: (cashierId) => {
        set({ selectedCashier: cashierId });
        get().loadCashierReports();
    },

    loadReports: () => {
        const { period } = get();
        const salesData = ReportRepo.getSalesChart(period);
        const topProducts = ReportRepo.getTopProducts(10);
        const categoryData = ReportRepo.getCategoryPerformance();

        set({ salesData, topProducts, categoryData });
    },

    loadCashierReports: () => {
        const { period, selectedCashier } = get();
        const cashierPerformance = ReportRepo.getCashierPerformance(period, selectedCashier || undefined);
        const cashierDailyPerformance = ReportRepo.getCashierDailyPerformance(period, selectedCashier || undefined);
        const sessionReports = ReportRepo.getSessionReports(period, selectedCashier || undefined);

        set({ cashierPerformance, cashierDailyPerformance, sessionReports });
    },
}));
