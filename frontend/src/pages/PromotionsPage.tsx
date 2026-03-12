import { useEffect, useState } from "react";
import { usePromotionStore } from "@/stores/promotionStore";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Promotion } from "@/types/entities";

export default function PromotionsPage() {
  const { items: promotions, isLoading, fetchAll, createItem, updateItem, deleteItem } = usePromotionStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState({
    name: "", type: "price_discount" as Promotion["type"], status: "active" as Promotion["status"],
    start_date: new Date().toISOString().split("T")[0], end_date: "", config: "{}"
  });

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setForm({ name: "", type: "price_discount", status: "active", start_date: new Date().toISOString().split("T")[0], end_date: "", config: "{}" });
    setEditing(null); setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, config: JSON.parse(form.config) };
      if (editing) { await updateItem(editing.id, payload); toast.success("Promotion updated"); }
      else { await createItem(payload); toast.success("Promotion created"); }
      resetForm();
    } catch (err: any) {
      if (err instanceof SyntaxError) toast.error("Invalid JSON in config");
      else toast.error("Failed to save promotion");
    }
  };

  const handleEdit = (p: Promotion) => {
    setForm({ name: p.name, type: p.type, status: p.status, start_date: p.start_date, end_date: p.end_date, config: JSON.stringify(p.config, null, 2) });
    setEditing(p); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promotion?")) return;
    try { await deleteItem(id); toast.success("Promotion deleted"); } catch { toast.error("Failed to delete"); }
  };

  const typeLabel = (t: string) => t === "price_discount" ? "Price Discount" : t === "quantity_discount" ? "Quantity Discount" : "Pack Discount";
  const statusColor = (s: string) => s === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promotions</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Promotion
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border bg-white p-4">
          <h2 className="mb-4 font-semibold">{editing ? "Edit Promotion" : "New Promotion"}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="rounded-lg border px-3 py-2 text-sm">
              <option value="price_discount">Price Discount</option>
              <option value="quantity_discount">Quantity Discount</option>
              <option value="pack_discount">Pack Discount</option>
            </select>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="rounded-lg border px-3 py-2 text-sm">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" placeholder="End date" />
            <textarea value={form.config} onChange={(e) => setForm({ ...form, config: e.target.value })} placeholder='Config JSON (e.g. {"discount_percent": 10})' className="rounded-lg border px-3 py-2 text-sm font-mono col-span-full" rows={3} />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">{editing ? "Update" : "Create"}</button>
            <button type="button" onClick={resetForm} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Period</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : promotions.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No promotions found</td></tr>
            ) : promotions.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{typeLabel(p.type)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span></td>
                <td className="px-4 py-3 text-gray-500 text-xs">{p.start_date} → {p.end_date || "∞"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEdit(p)} className="mr-2 text-gray-500 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
