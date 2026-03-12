import { useEffect, useState } from "react";
import { useCategoryStore } from "@/stores/categoryStore";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Category } from "@/types/entities";

export default function CategoriesPage() {
  const { items: categories, isLoading, fetchAll, createItem, updateItem, deleteItem } = useCategoryStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", description: "", color: "#3b82f6" });

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => { setForm({ name: "", description: "", color: "#3b82f6" }); setEditing(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await updateItem(editing.id, form); toast.success("Category updated"); }
      else { await createItem(form); toast.success("Category created"); }
      resetForm();
    } catch { toast.error("Failed to save category"); }
  };

  const handleEdit = (c: Category) => {
    setForm({ name: c.name, description: c.description, color: c.color });
    setEditing(c); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try { await deleteItem(id); toast.success("Category deleted"); } catch { toast.error("Failed to delete"); }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border bg-white p-4">
          <h2 className="mb-4 font-semibold">{editing ? "Edit Category" : "New Category"}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <div className="flex items-center gap-2">
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-9 w-9 cursor-pointer rounded border" />
              <span className="text-sm text-gray-500">Color</span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">{editing ? "Update" : "Create"}</button>
            <button type="button" onClick={resetForm} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="col-span-full text-center text-gray-500 py-8">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="col-span-full text-center text-gray-500 py-8">No categories yet</p>
        ) : categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full" style={{ backgroundColor: c.color }} />
              <div>
                <p className="font-medium">{c.name}</p>
                {c.description && <p className="text-xs text-gray-500">{c.description}</p>}
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => handleEdit(c)} className="rounded p-1 text-gray-500 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(c.id)} className="rounded p-1 text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
