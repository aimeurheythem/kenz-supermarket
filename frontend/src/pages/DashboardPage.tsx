import { useEffect } from "react";
import { useReportStore } from "@/stores/reportStore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { salesSummary, topProducts, stockAlerts, isLoading, fetchDashboard } = useReportStore();

  useEffect(() => { fetchDashboard(); }, []);

  const todaySales = salesSummary[0];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      {isLoading ? (
        <p className="text-gray-500">Loading dashboard...</p>
      ) : (
        <>
          {/* Summary cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2"><ShoppingCart className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="text-sm text-gray-500">Today's Sales</p>
                  <p className="text-xl font-bold">{todaySales?.total_sales ?? 0}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2"><DollarSign className="h-5 w-5 text-green-600" /></div>
                <div>
                  <p className="text-sm text-gray-500">Today's Revenue</p>
                  <p className="text-xl font-bold">{todaySales?.total_revenue ?? "0.00"}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-50 p-2"><TrendingUp className="h-5 w-5 text-purple-600" /></div>
                <div>
                  <p className="text-sm text-gray-500">Top Products</p>
                  <p className="text-xl font-bold">{topProducts.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-50 p-2"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
                <div>
                  <p className="text-sm text-gray-500">Stock Alerts</p>
                  <p className="text-xl font-bold">{stockAlerts.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue chart */}
          <div className="mb-8 rounded-xl border bg-white p-4">
            <h2 className="mb-4 font-semibold">Revenue Trend</h2>
            {salesSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={salesSummary}>
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total_revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-gray-500">No sales data yet</p>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top products */}
            <div className="rounded-xl border bg-white p-4">
              <h2 className="mb-4 font-semibold">Top Products</h2>
              {topProducts.length > 0 ? (
                <ul className="space-y-2">
                  {topProducts.slice(0, 10).map((p, i) => (
                    <li key={p.product_id} className="flex items-center justify-between text-sm">
                      <span><span className="mr-2 text-gray-400">{i + 1}.</span>{p.product_name}</span>
                      <span className="font-medium">{p.total_quantity} sold</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-center text-gray-500">No data</p>
              )}
            </div>

            {/* Stock alerts */}
            <div className="rounded-xl border bg-white p-4">
              <h2 className="mb-4 font-semibold">Low Stock Alerts</h2>
              {stockAlerts.length > 0 ? (
                <ul className="space-y-2">
                  {stockAlerts.slice(0, 10).map((a) => (
                    <li key={a.id} className="flex items-center justify-between text-sm">
                      <span>{a.name}</span>
                      <span className="text-red-600 font-medium">{a.stock_quantity} / {a.reorder_level}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-center text-green-600">All stock levels OK</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
