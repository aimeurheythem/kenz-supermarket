import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/userStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { User } from "@/types/entities";

export default function UsersPage() {
  const { items: users, isLoading, fetchAll, createItem, updateItem, deleteItem } = useUserStore();
  const { user: currentUser } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<{ username: string; email: string; full_name: string; role: "owner" | "manager" | "cashier"; password: string }>({ username: "", email: "", full_name: "", role: "cashier", password: "" });

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => { setForm({ username: "", email: "", full_name: "", role: "cashier", password: "" }); setEditing(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const { password, ...rest } = form;
        await updateItem(editing.id, password ? form : rest);
        toast.success("User updated");
      } else {
        await createItem(form);
        toast.success("User created");
      }
      resetForm();
    } catch { toast.error("Failed to save user"); }
  };

  const handleEdit = (u: User) => {
    setForm({ username: u.username, email: u.email, full_name: u.full_name, role: u.role as "owner" | "manager" | "cashier", password: "" });
    setEditing(u); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try { await deleteItem(id); toast.success("User deleted"); } catch { toast.error("Failed to delete"); }
  };

  const roleColor = (r: string) => r === "owner" ? "bg-purple-100 text-purple-700" : r === "manager" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700";

  const allowedRoles = currentUser?.role === "owner" ? ["manager", "cashier"] : ["cashier"];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border bg-white p-4">
          <h2 className="mb-4 font-semibold">{editing ? "Edit User" : "New User"}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input required placeholder="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "owner" | "manager" | "cashier" })} className="rounded-lg border px-3 py-2 text-sm">
              {allowedRoles.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            <input type="password" placeholder={editing ? "New password (leave blank to keep)" : "Password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} minLength={8} className="rounded-lg border px-3 py-2 text-sm col-span-full" />
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
              <th className="px-4 py-3 text-left font-medium">Username</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.full_name}</td>
                <td className="px-4 py-3 text-gray-500">{u.username}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColor(u.role)}`}>{u.role}</span></td>
                <td className="px-4 py-3">{u.is_active ? <span className="text-green-600">Active</span> : <span className="text-red-600">Inactive</span>}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEdit(u)} className="mr-2 text-gray-500 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                  {u.id !== currentUser?.id && <button onClick={() => handleDelete(u.id)} className="text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
