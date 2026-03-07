// ClientInfoPanel.tsx — Customer info card for left panel
import { CircleUser, Search, X, PenLine, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Customer } from '@/lib/types';

interface ClientInfoPanelProps {
    customer: Customer | null;
    onSearch: () => void;
    onClear: () => void;
    onEdit: () => void;
    onAddNew: () => void;
}

export default function ClientInfoPanel({ customer, onSearch, onClear, onEdit, onAddNew }: ClientInfoPanelProps) {
    const { t } = useTranslation();

    if (!customer) {
        return (
            <div className="flex items-center">
                <div className="flex items-center gap-2.5 flex-1 min-w-0 px-4 py-3 md:py-4">
                    <CircleUser size={20} strokeWidth={1.5} className="text-zinc-300 shrink-0" />
                    <span className="text-base font-medium text-zinc-500">{t('pos.walk_in', 'Walk-in Customer')}</span>
                </div>
                <div className="flex self-stretch shrink-0">
                    <button
                        onClick={onSearch}
                        className="flex items-center gap-2 px-5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition-colors active:scale-[0.98]"
                    >
                        <Search size={15} strokeWidth={1.5} />
                        {t('pos.search', 'Search')}
                    </button>
                    <button
                        onClick={onAddNew}
                        className="flex items-center gap-2 px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-sm font-medium transition-colors active:scale-[0.98]"
                    >
                        <UserPlus size={15} strokeWidth={1.5} />
                        {t('pos.add_new', 'New')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center">
            {/* Customer info */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0 px-4 py-3 md:py-4">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <CircleUser size={18} strokeWidth={1.5} className="text-emerald-500" />
                </div>
                <div className="min-w-0">
                    <div className="text-base font-semibold text-zinc-800 truncate">{customer.full_name}</div>
                    <div className="text-xs text-zinc-400 truncate">
                        {customer.phone || customer.email || `ID: ${customer.id}`}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex self-stretch shrink-0">
                <button
                    onClick={onSearch}
                    className="flex items-center gap-1.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-sm font-medium transition-colors active:scale-[0.98]"
                >
                    <Search size={15} strokeWidth={1.5} />
                    {t('pos.change', 'Change')}
                </button>
                <button
                    onClick={onEdit}
                    className="flex items-center gap-1.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-sm font-medium transition-colors active:scale-[0.98]"
                >
                    <PenLine size={15} strokeWidth={1.5} />
                    {t('pos.edit', 'Edit')}
                </button>
                <button
                    onClick={onClear}
                    className="flex items-center justify-center px-4 bg-zinc-100 hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
                    title={t('pos.clear_customer', 'Clear customer')}
                >
                    <X size={16} strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
}
