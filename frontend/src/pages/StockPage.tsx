import { useEffect, useState } from "react";
import { useStockStore } from "@/stores/stockStore";
import { useProductStore } from "@/stores/productStore";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";

export default function StockPage() {
  const { items: movements, total, isLoading, fetchAll, createItem } = useStockStore();
  const { items: products, fetchAll: fetchProducts } = useProductStore();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ product_id: "", type: "adjustment", quantity: "", reason: "" });

  useEffect(() => { fetchAll({ search }); }, [search]);
  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createItem({ ...form, quantity: Number(form.quantity) } as any);
      toast.success("Stock movement recorded");
      setShowForm(false);
      setForm({ product_id: "", type: "adjustment", quantity: "", reason: "" });
    } catch { toast.error("Failed to record movement"); }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stock Movements</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Manual Adjustment
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border bg-white p-4">
          <h2 className="mb-4 font-semibold">Manual Stock Adjustment</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <select required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">Select Product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
              <option value="adjustment">Adjustment</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="return">Return</option>
              <option value="damage">Damage</option>
            </select>
            <input required type="number" placeholder="Quantity (+ or -)" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Record</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-right font-medium">Quantity</th>
              <th className="px-4 py-3 text-right font-medium">Previous</th>
              <th className="px-4 py-3 text-right font-medium">New</th>
              <th className="px-4 py-3 text-left font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : movements.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No movements found</td></tr>
            ) : movements.map((m) => (
              <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">{new Date(m.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 capitalize">{m.type}</td>
                <td className="px-4 py-3 text-right font-medium">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-500">{m.previous_stock}</td>
                <td className="px-4 py-3 text-right">{m.new_stock}</td>
                <td className="px-4 py-3 text-gray-500">{m.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 0 && <p className="mt-2 text-sm text-gray-500">{total} movement(s)</p>}
    </div>
  );
}
