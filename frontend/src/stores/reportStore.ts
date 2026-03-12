import { create } from "zustand";
import apiClient from "@/services/apiClient";

interface SalesSummary {
  period: string;
  total_sales: number;
  total_revenue: string;
  total_tax: string;
  total_discount: string;
}

interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: string;
}

interface StockAlert {
  id: string;
  name: string;
  stock_quantity: number;
  reorder_level: number;
}

interface CashierPerf {
  user_id: string;
  user_name: string;
  total_sales: number;
  total_revenue: string;
}

interface ExpenseSummary {
  category: string;
  total_amount: string;
  count: number;
}

interface ReportState {
  salesSummary: SalesSummary[];
  topProducts: TopProduct[];
  stockAlerts: StockAlert[];
  cashierPerformance: CashierPerf[];
  expenseSummary: ExpenseSummary[];
  isLoading: boolean;

  fetchSalesSummary: (params?: Record<string, string>) => Promise<void>;
  fetchTopProducts: (params?: Record<string, string>) => Promise<void>;
  fetchStockAlerts: () => Promise<void>;
  fetchCashierPerformance: (params?: Record<string, string>) => Promise<void>;
  fetchExpenseSummary: (params?: Record<string, string>) => Promise<void>;
  fetchDashboard: () => Promise<void>;
}

export const useReportStore = create<ReportState>((set) => ({
  salesSummary: [],
  topProducts: [],
  stockAlerts: [],
  cashierPerformance: [],
  expenseSummary: [],
  isLoading: false,

  fetchSalesSummary: async (params) => {
    const { data } = await apiClient.get("/reports/sales-summary/", { params });
    set({ salesSummary: data });
  },

  fetchTopProducts: async (params) => {
    const { data } = await apiClient.get("/reports/top-products/", { params });
    set({ topProducts: data });
  },

  fetchStockAlerts: async () => {
    const { data } = await apiClient.get("/reports/stock-alerts/");
    set({ stockAlerts: data });
  },

  fetchCashierPerformance: async (params) => {
    const { data } = await apiClient.get("/reports/cashier-performance/", { params });
    set({ cashierPerformance: data });
  },

  fetchExpenseSummary: async (params) => {
    const { data } = await apiClient.get("/reports/expense-summary/", { params });
    set({ expenseSummary: data });
  },

  fetchDashboard: async () => {
    set({ isLoading: true });
    try {
      const [sales, top, alerts] = await Promise.all([
        apiClient.get("/reports/sales-summary/", { params: { period: "daily" } }),
        apiClient.get("/reports/top-products/"),
        apiClient.get("/reports/stock-alerts/"),
      ]);
      set({ salesSummary: sales.data, topProducts: top.data, stockAlerts: alerts.data });
    } finally {
      set({ isLoading: false });
    }
  },
}));
