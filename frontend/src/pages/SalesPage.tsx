import { useEffect, useState } from "react";
import { useSaleStore } from "@/stores/saleStore";
import { toast } from "sonner";
import { Search, Eye } from "lucide-react";
import apiClient from "@/services/apiClient";
import type { Sale } from "@/types/entities";

export default function SalesPage() {
  const { items: sales, total, isLoading, fetchAll } = useSaleStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detail, setDetail] = useState<Sale | null>(null);

  useEffect(() => { fetchAll({ search, status: statusFilter || undefined }); }, [search, statusFilter]);

  const handleVoid = async (id: string) => {
    if (!confirm("Void this sale? This will restore stock.")) return;
    try {
      await apiClient.post(`/sales/${id}/void_sale/`, { reason: "Voided from dashboard" });
      toast.success("Sale voided");
      fetchAll({ search, status: statusFilter || undefined });
    } catch { toast.error("Failed to void sale"); }
  };

  const handleReturn = async (id: string) => {
    if (!confirm("Return this sale? A return record will be created.")) return;
    try {
      await apiClient.post(`/sales/${id}/return_sale/`, { reason: "Returned from dashboard" });
      toast.success("Sale returned");
      fetchAll({ search, status: statusFilter || undefined });
    } catch { toast.error("Failed to return sale"); }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const { data } = await apiClient.get<Sale>(`/sales/${id}/`);
      setDetail(data);
    } catch { toast.error("Failed to load sale details"); }
  };

  const statusColor = (s: string) => s === "completed" ? "bg-green-100 text-green-700" : s === "voided" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Sales</h1>
        <p className="text-sm text-gray-500">View and manage sales (read-only — sales are made from POS)</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ticket..." className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="voided">Voided</option>
          <option value="returned">Returned</option>
        </select>
      </div>

      {detail && (
        <div className="mb-6 rounded-lg border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Sale #{detail.ticket_number}</h2>
            <button onClick={() => setDetail(null)} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <p>Status: <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(detail.status)}`}>{detail.status}</span></p>
            <p>Total: {detail.total}</p>
            <p>Payment: {detail.payment_method}</p>
          </div>
          {detail.items && detail.items.length > 0 && (
            <table className="mt-3 w-full text-sm">
              <thead><tr><th className="text-left py-1">Product</th><th className="text-right py-1">Qty</th><th className="text-right py-1">Price</th><th className="text-right py-1">Total</th></tr></thead>
              <tbody>{detail.items.map((i) => (
                <tr key={i.id}><td className="py-1">{i.product_name}</td><td className="text-right py-1">{i.quantity}</td><td className="text-right py-1">{i.unit_price}</td><td className="text-right py-1">{i.total}</td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Ticket</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Payment</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No sales found</td></tr>
            ) : sales.map((s) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">#{s.ticket_number || "—"}</td>
                <td className="px-4 py-3">{new Date(s.sale_date).toLocaleDateString()}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(s.status)}`}>{s.status}</span></td>
                <td className="px-4 py-3 text-gray-500">{s.payment_method}</td>
                <td className="px-4 py-3 text-right font-medium">{s.total}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleViewDetail(s.id)} className="mr-2 text-gray-500 hover:text-blue-600"><Eye className="h-4 w-4" /></button>
                  {s.status === "completed" && (
                    <>
                      <button onClick={() => handleVoid(s.id)} className="mr-2 text-xs text-red-600 hover:underline">Void</button>
                      <button onClick={() => handleReturn(s.id)} className="text-xs text-orange-600 hover:underline">Return</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 0 && <p className="mt-2 text-sm text-gray-500">{total} sale(s)</p>}
    </div>
  );
}
