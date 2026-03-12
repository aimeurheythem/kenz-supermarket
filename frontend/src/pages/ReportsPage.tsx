import { useEffect, useState } from "react";
import { useReportStore } from "@/stores/reportStore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

type Tab = "sales" | "products" | "cashiers" | "expenses";

export default function ReportsPage() {
  const { salesSummary, topProducts, cashierPerformance, expenseSummary, fetchSalesSummary, fetchTopProducts, fetchCashierPerformance, fetchExpenseSummary } = useReportStore();
  const [tab, setTab] = useState<Tab>("sales");
  const [period, setPeriod] = useState("daily");

  useEffect(() => {
    if (tab === "sales") fetchSalesSummary({ period });
    if (tab === "products") fetchTopProducts();
    if (tab === "cashiers") fetchCashierPerformance();
    if (tab === "expenses") fetchExpenseSummary();
  }, [tab, period]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "sales", label: "Sales Summary" },
    { key: "products", label: "Top Products" },
    { key: "cashiers", label: "Cashier Performance" },
    { key: "expenses", label: "Expense Summary" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Reports</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === t.key ? "bg-blue-600 text-white" : "bg-white border text-gray-700 hover:bg-gray-50"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-6">
        {tab === "sales" && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="font-semibold">Sales Summary</h2>
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-lg border px-3 py-1 text-sm">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            {salesSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesSummary}>
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total_revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total_sales" name="# Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="py-8 text-center text-gray-500">No data</p>}
          </>
        )}

        {tab === "products" && (
          <>
            <h2 className="mb-4 font-semibold">Top Products by Quantity Sold</h2>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts.slice(0, 10)} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="product_name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="total_quantity" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="py-8 text-center text-gray-500">No data</p>}
          </>
        )}

        {tab === "cashiers" && (
          <>
            <h2 className="mb-4 font-semibold">Cashier Performance</h2>
            {cashierPerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr><th className="px-4 py-2 text-left">Cashier</th><th className="px-4 py-2 text-right">Sales</th><th className="px-4 py-2 text-right">Revenue</th></tr>
                  </thead>
                  <tbody>
                    {cashierPerformance.map((c) => (
                      <tr key={c.user_id} className="border-b last:border-0"><td className="px-4 py-2">{c.user_name}</td><td className="px-4 py-2 text-right">{c.total_sales}</td><td className="px-4 py-2 text-right font-medium">{c.total_revenue}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="py-8 text-center text-gray-500">No data</p>}
          </>
        )}

        {tab === "expenses" && (
          <>
            <h2 className="mb-4 font-semibold">Expenses by Category</h2>
            {expenseSummary.length > 0 ? (
              <div className="flex flex-col items-center gap-6 md:flex-row">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={expenseSummary} dataKey="total_amount" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={(e) => e.category}>
                      {expenseSummary.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <table className="text-sm">
                  <thead><tr><th className="px-3 py-1 text-left">Category</th><th className="px-3 py-1 text-right">Amount</th><th className="px-3 py-1 text-right">Count</th></tr></thead>
                  <tbody>{expenseSummary.map((e) => <tr key={e.category}><td className="px-3 py-1 capitalize">{e.category}</td><td className="px-3 py-1 text-right">{e.total_amount}</td><td className="px-3 py-1 text-right">{e.count}</td></tr>)}</tbody>
                </table>
              </div>
            ) : <p className="py-8 text-center text-gray-500">No data</p>}
          </>
        )}
      </div>
    </div>
  );
}
