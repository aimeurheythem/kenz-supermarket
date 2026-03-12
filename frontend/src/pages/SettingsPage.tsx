import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { toast } from "sonner";
import { Save } from "lucide-react";

const SETTING_DEFS = [
  { key: "currency", label: "Currency", type: "text", placeholder: "DZD" },
  { key: "tax_rate", label: "Tax Rate (%)", type: "number", placeholder: "0" },
  { key: "receipt_header", label: "Receipt Header", type: "textarea", placeholder: "Store name and address" },
  { key: "receipt_footer", label: "Receipt Footer", type: "textarea", placeholder: "Thank you message" },
  { key: "low_stock_threshold", label: "Low Stock Alert Threshold", type: "number", placeholder: "10" },
  { key: "language", label: "Language", type: "select", options: ["en", "fr", "ar"] },
];

export default function SettingsPage() {
  const { settings, isLoading, fetchSettings, updateSetting } = useSettingsStore();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { fetchSettings(); }, []);

  useEffect(() => {
    const map: Record<string, string> = {};
    settings.forEach((s) => { map[s.key] = s.value || ""; });
    setValues(map);
  }, [settings]);

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      await updateSetting(key, values[key] || "");
      toast.success(`${key} updated`);
    } catch { toast.error(`Failed to update ${key}`); }
    finally { setSaving(null); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500">Configure your store settings</p>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading settings...</p>
      ) : (
        <div className="space-y-4">
          {SETTING_DEFS.map((def) => (
            <div key={def.key} className="flex flex-col gap-2 rounded-lg border bg-white p-4 sm:flex-row sm:items-center sm:gap-4">
              <label className="w-48 shrink-0 text-sm font-medium">{def.label}</label>
              <div className="flex flex-1 gap-2">
                {def.type === "textarea" ? (
                  <textarea
                    value={values[def.key] || ""}
                    onChange={(e) => setValues({ ...values, [def.key]: e.target.value })}
                    placeholder={def.placeholder}
                    className="flex-1 rounded-lg border px-3 py-2 text-sm"
                    rows={2}
                  />
                ) : def.type === "select" ? (
                  <select
                    value={values[def.key] || ""}
                    onChange={(e) => setValues({ ...values, [def.key]: e.target.value })}
                    className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  >
                    {def.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={def.type}
                    value={values[def.key] || ""}
                    onChange={(e) => setValues({ ...values, [def.key]: e.target.value })}
                    placeholder={def.placeholder}
                    className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  />
                )}
                <button
                  onClick={() => handleSave(def.key)}
                  disabled={saving === def.key}
                  className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving === def.key ? "..." : "Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
