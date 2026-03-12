import { useEffect, useState } from "react";
import { useProductStore } from "@/stores/productStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/types/entities";

export default function InventoryPage() {
  const { items: products, total, isLoading, fetchAll, createItem, updateItem, deleteItem } = useProductStore();
  const { items: categories, fetchAll: fetchCategories } = useCategoryStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", barcode: "", cost_price: "", selling_price: "", category_id: "", reorder_level: "10", unit: "piece" });

  useEffect(() => { fetchAll({ search, category_id: categoryFilter || undefined }); }, [search, categoryFilter]);
  useEffect(() => { fetchCategories(); }, []);

  const resetForm = () => { setForm({ name: "", barcode: "", cost_price: "", selling_price: "", category_id: "", reorder_level: "10", unit: "piece" }); setEditing(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateItem(editing.id, form);
        toast.success("Product updated");
      } else {
        await createItem(form);
        toast.success("Product created");
      }
      resetForm();
    } catch { toast.error("Failed to save product"); }
  };

  const handleEdit = (p: Product) => {
    setForm({ name: p.name, barcode: p.barcode || "", cost_price: p.cost_price, selling_price: p.selling_price, category_id: p.category_id || "", reorder_level: String(p.reorder_level), unit: p.unit });
    setEditing(p);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try { await deleteItem(id); toast.success("Product deleted"); } catch { toast.error("Failed to delete"); }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border bg-white p-4">
          <h2 className="mb-4 font-semibold">{editing ? "Edit Product" : "New Product"}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input required type="number" step="0.01" placeholder="Cost Price" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input required type="number" step="0.01" placeholder="Selling Price" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">No Category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="number" placeholder="Reorder Level" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
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
              <th className="px-4 py-3 text-left font-medium">Barcode</th>
              <th className="px-4 py-3 text-right font-medium">Cost</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No products found</td></tr>
            ) : products.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.barcode || "—"}</td>
                <td className="px-4 py-3 text-right">{p.cost_price}</td>
                <td className="px-4 py-3 text-right">{p.selling_price}</td>
                <td className="px-4 py-3 text-right">
                  <span className={p.stock_quantity <= p.reorder_level ? "text-red-600 font-medium" : ""}>{p.stock_quantity}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEdit(p)} className="mr-2 text-gray-500 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 0 && <p className="mt-2 text-sm text-gray-500">{total} product(s)</p>}
    </div>
  );
}
