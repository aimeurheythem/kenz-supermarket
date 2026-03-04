// ClientInfoPanel.tsx — Customer info card for left panel
import { User, Search, X, Edit, UserPlus, Phone, Mail, MapPin, Hash } from 'lucide-react';
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
            <div className="p-3 border-b border-zinc-100">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        {t('pos.customer', 'Customer')}
                    </div>
                </div>
                <div className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center">
                        <User size={16} className="text-zinc-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-zinc-700">{t('pos.walk_in', 'Walk-in Customer')}</div>
                        <div className="text-[10px] text-zinc-400">{t('pos.no_customer_selected', 'No customer selected')}</div>
                    </div>
                </div>
                <div className="flex gap-1 mt-2">
                    <button
                        onClick={onSearch}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-xs font-bold transition-all active:scale-95"
                    >
                        <Search size={12} />
                        {t('pos.search', 'Search')}
                    </button>
                    <button
                        onClick={onAddNew}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-xs font-bold transition-all active:scale-95"
                    >
                        <UserPlus size={12} />
                        {t('pos.add_new', 'New')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 border-b border-zinc-100">
            <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    {t('pos.customer', 'Customer')}
                </div>
                <button
                    onClick={onClear}
                    className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-red-500 transition-colors"
                    title={t('pos.clear_customer', 'Clear customer')}
                >
                    <X size={12} />
                </button>
            </div>

            {/* Customer name with avatar */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <User size={16} className="text-blue-600" />
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-bold text-zinc-800 truncate">{customer.full_name}</div>
                </div>
            </div>

            {/* Contact details */}
            <div className="space-y-1.5 text-xs text-zinc-500">
                {customer.id && (
                    <div className="flex items-center gap-2">
                        <Hash size={11} className="text-zinc-400 shrink-0" />
                        <span className="truncate">{t('pos.client_id', 'ID')}: {customer.id}</span>
                    </div>
                )}
                {customer.phone && (
                    <div className="flex items-center gap-2">
                        <Phone size={11} className="text-zinc-400 shrink-0" />
                        <span className="truncate">{customer.phone}</span>
                    </div>
                )}
                {customer.email && (
                    <div className="flex items-center gap-2">
                        <Mail size={11} className="text-zinc-400 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                    </div>
                )}
                {customer.address && (
                    <div className="flex items-center gap-2">
                        <MapPin size={11} className="text-zinc-400 shrink-0" />
                        <span className="truncate">{customer.address}</span>
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-1 mt-3">
                <button
                    onClick={onSearch}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-xs font-bold transition-all active:scale-95"
                >
                    <Search size={12} />
                    {t('pos.change', 'Change')}
                </button>
                <button
                    onClick={onEdit}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-xs font-bold transition-all active:scale-95"
                >
                    <Edit size={12} />
                    {t('pos.edit', 'Edit')}
                </button>
            </div>
        </div>
    );
}
