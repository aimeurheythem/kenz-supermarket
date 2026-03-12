import { useEffect, useState } from "react";
import { useCustomerStore } from "@/stores/customerStore";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import type { Customer } from "@/types/entities";

export default function CustomersPage() {
  const { items: customers, total, isLoading, fetchAll, createItem, updateItem, deleteItem } = useCustomerStore();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", address: "", notes: "" });

  useEffect(() => { fetchAll({ search }); }, [search]);

  const resetForm = () => { setForm({ full_name: "", phone: "", email: "", address: "", notes: "" }); setEditing(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await updateItem(editing.id, form); toast.success("Customer updated"); }
      else { await createItem(form); toast.success("Customer created"); }
      resetForm();
    } catch { toast.error("Failed to save customer"); }
  };

  const handleEdit = (c: Customer) => {
    setForm({ full_name: c.full_name, phone: c.phone || "", email: c.email || "", address: c.address || "", notes: c.notes || "" });
    setEditing(c); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    try { await deleteItem(id); toast.success("Customer deleted"); } catch { toast.error("Failed to delete"); }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border bg-white p-4">
          <h2 className="mb-4 font-semibold">{editing ? "Edit Customer" : "New Customer"}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-lg border px-3 py-2 text-sm col-span-full" rows={2} />
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
              <th className="px-4 py-3 text-left font-medium">Phone</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-right font-medium">Debt</th>
              <th className="px-4 py-3 text-right font-medium">Points</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No customers found</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.full_name}</td>
                <td className="px-4 py-3 text-gray-500">{c.phone || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{c.email || "—"}</td>
                <td className="px-4 py-3 text-right">{c.total_debt}</td>
                <td className="px-4 py-3 text-right">{c.loyalty_points}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEdit(c)} className="mr-2 text-gray-500 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 0 && <p className="mt-2 text-sm text-gray-500">{total} customer(s)</p>}
    </div>
  );
}
