import { useEffect, useState } from "react";
import { useExpenseStore } from "@/stores/expenseStore";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import type { Expense } from "@/types/entities";

const CATEGORIES = ["food", "utilities", "rent", "salaries", "maintenance", "transport", "other"];

export default function ExpensesPage() {
  const { items: expenses, total, isLoading, fetchAll, createItem, updateItem, deleteItem } = useExpenseStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState({ description: "", amount: "", category: "other", date: new Date().toISOString().split("T")[0], payment_method: "cash" });

  useEffect(() => { fetchAll({ search, category: categoryFilter || undefined }); }, [search, categoryFilter]);

  const resetForm = () => { setForm({ description: "", amount: "", category: "other", date: new Date().toISOString().split("T")[0], payment_method: "cash" }); setEditing(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await updateItem(editing.id, form); toast.success("Expense updated"); }
      else { await createItem(form); toast.success("Expense created"); }
      resetForm();
    } catch { toast.error("Failed to save expense"); }
  };

  const handleEdit = (ex: Expense) => {
    setForm({ description: ex.description, amount: ex.amount, category: ex.category, date: ex.date, payment_method: ex.payment_method });
    setEditing(ex); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try { await deleteItem(id); toast.success("Expense deleted"); } catch { toast.error("Failed to delete"); }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Expense
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expenses..." className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border bg-white p-4">
          <h2 className="mb-4 font-semibold">{editing ? "Edit Expense" : "New Expense"}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input required type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile">Mobile</option>
            </select>
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
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Payment</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No expenses found</td></tr>
            ) : expenses.map((ex) => (
              <tr key={ex.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">{ex.date}</td>
                <td className="px-4 py-3 font-medium">{ex.description}</td>
                <td className="px-4 py-3 capitalize text-gray-500">{ex.category}</td>
                <td className="px-4 py-3 capitalize text-gray-500">{ex.payment_method}</td>
                <td className="px-4 py-3 text-right font-medium">{ex.amount}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEdit(ex)} className="mr-2 text-gray-500 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(ex.id)} className="text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 0 && <p className="mt-2 text-sm text-gray-500">{total} expense(s)</p>}
    </div>
  );
}
