import { useEffect, useState } from "react";
import { usePurchaseStore } from "@/stores/purchaseStore";
import { useSupplierStore } from "@/stores/supplierStore";
import { toast } from "sonner";
import { Plus, Search, Eye } from "lucide-react";
import apiClient from "@/services/apiClient";
import type { PurchaseOrder } from "@/types/entities";

export default function PurchasesPage() {
  const { items: orders, total, isLoading, fetchAll, createItem } = usePurchaseStore();
  const { items: suppliers, fetchAll: fetchSuppliers } = useSupplierStore();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState<PurchaseOrder | null>(null);
  const [form, setForm] = useState({ supplier_id: "", notes: "", items: [{ product_id: "", quantity: "1", unit_cost: "" }] });

  useEffect(() => { fetchAll({ search }); }, [search]);
  useEffect(() => { fetchSuppliers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createItem({
        ...form,
        items: form.items.filter((i) => i.product_id).map((i) => ({ product_id: i.product_id, quantity: Number(i.quantity), unit_cost: i.unit_cost })),
      } as any);
      toast.success("Purchase order created");
      setShowForm(false);
      setForm({ supplier_id: "", notes: "", items: [{ product_id: "", quantity: "1", unit_cost: "" }] });
    } catch { toast.error("Failed to create order"); }
  };

  const handleReceive = async (id: string) => {
    try {
      await apiClient.patch(`/purchase-orders/${id}/receive/`, { items: [] });
      toast.success("Order received");
      fetchAll({ search });
    } catch { toast.error("Failed to receive order"); }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const { data } = await apiClient.get<PurchaseOrder>(`/purchase-orders/${id}/`);
      setDetail(data);
    } catch { toast.error("Failed to load order details"); }
  };

  const statusColor = (s: string) => s === "received" ? "bg-green-100 text-green-700" : s === "cancelled" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> New Order
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border bg-white p-4">
          <h2 className="mb-4 font-semibold">New Purchase Order</h2>
          <select required value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="mb-3 w-full rounded-lg border px-3 py-2 text-sm">
            <option value="">Select Supplier</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mb-3 w-full rounded-lg border px-3 py-2 text-sm" rows={2} />
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {detail && (
        <div className="mb-6 rounded-lg border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Order Details</h2>
            <button onClick={() => setDetail(null)} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
          </div>
          <p className="text-sm text-gray-600">Status: <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(detail.status)}`}>{detail.status}</span></p>
          <p className="text-sm text-gray-600">Total: {detail.total_amount}</p>
          {detail.items && detail.items.length > 0 && (
            <table className="mt-3 w-full text-sm">
              <thead><tr><th className="text-left py-1">Product</th><th className="text-right py-1">Qty</th><th className="text-right py-1">Unit Cost</th><th className="text-right py-1">Received</th></tr></thead>
              <tbody>{detail.items.map((i) => (
                <tr key={i.id}><td className="py-1">{i.product_id}</td><td className="text-right py-1">{i.quantity}</td><td className="text-right py-1">{i.unit_cost}</td><td className="text-right py-1">{i.received_quantity}</td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-right font-medium">Paid</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No orders found</td></tr>
            ) : orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">{new Date(o.order_date).toLocaleDateString()}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(o.status)}`}>{o.status}</span></td>
                <td className="px-4 py-3 text-right">{o.total_amount}</td>
                <td className="px-4 py-3 text-right">{o.paid_amount}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleViewDetail(o.id)} className="mr-2 text-gray-500 hover:text-blue-600"><Eye className="h-4 w-4" /></button>
                  {o.status === "pending" && <button onClick={() => handleReceive(o.id)} className="text-xs text-green-600 hover:underline">Receive</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 0 && <p className="mt-2 text-sm text-gray-500">{total} order(s)</p>}
    </div>
  );
}
