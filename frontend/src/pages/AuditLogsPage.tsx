import { useEffect, useState } from "react";
import { useAuditStore } from "@/stores/auditStore";
import { Search } from "lucide-react";

export default function AuditLogsPage() {
  const { items: logs, total, isLoading, fetchAll } = useAuditStore();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  useEffect(() => { fetchAll({ search, action: actionFilter || undefined, entity: entityFilter || undefined }); }, [search, actionFilter, entityFilter]);

  const actionColor = (a: string) => a === "create" ? "bg-green-100 text-green-700" : a === "update" ? "bg-blue-100 text-blue-700" : a === "delete" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-gray-500">Track all changes made across the system</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All Entities</option>
          {["product", "category", "sale", "customer", "supplier", "user", "expense", "promotion"].map((e) => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Time</th>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
              <th className="px-4 py-3 text-left font-medium">Entity</th>
              <th className="px-4 py-3 text-left font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No audit logs found</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">{log.user_name || "System"}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionColor(log.action)}`}>{log.action}</span></td>
                <td className="px-4 py-3 capitalize">{log.entity}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{log.details || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 0 && <p className="mt-2 text-sm text-gray-500">{total} log(s)</p>}
    </div>
  );
}
