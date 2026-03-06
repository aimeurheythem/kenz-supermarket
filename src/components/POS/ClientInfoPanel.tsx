// ClientInfoPanel.tsx — Customer info card for left panel
import { CircleUser, Search, X, PenLine, UserPlus, Phone, Mail, MapPin, Hash } from 'lucide-react';
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
            <div className="p-4 border-b border-zinc-50">
                <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest">
                        {t('pos.customer', 'Customer')}
                    </div>
                </div>
                <div className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 rounded-full bg-zinc-50 flex items-center justify-center">
                        <CircleUser size={18} strokeWidth={1.5} className="text-zinc-300" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-zinc-600">{t('pos.walk_in', 'Walk-in Customer')}</div>
                        <div className="text-[10px] text-zinc-300">{t('pos.no_customer_selected', 'No customer selected')}</div>
                    </div>
                </div>
                <div className="flex gap-1.5 mt-3">
                    <button
                        onClick={onSearch}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 rounded-xl text-xs font-medium transition-all active:scale-95"
                    >
                        <Search size={12} strokeWidth={1.5} />
                        {t('pos.search', 'Search')}
                    </button>
                    <button
                        onClick={onAddNew}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 rounded-xl text-xs font-medium transition-all active:scale-95"
                    >
                        <UserPlus size={12} strokeWidth={1.5} />
                        {t('pos.add_new', 'New')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 border-b border-zinc-50">
            <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest">
                    {t('pos.customer', 'Customer')}
                </div>
                <button
                    onClick={onClear}
                    className="p-1 rounded-lg hover:bg-zinc-50 text-zinc-300 hover:text-red-400 transition-colors"
                    title={t('pos.clear_customer', 'Clear customer')}
                >
                    <X size={12} strokeWidth={1.5} />
                </button>
            </div>

            {/* Customer name with avatar */}
            <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <CircleUser size={18} strokeWidth={1.5} className="text-blue-400" />
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-medium text-zinc-700 truncate">{customer.full_name}</div>
                </div>
            </div>

            {/* Contact details */}
            <div className="space-y-2 text-xs text-zinc-400">
                {customer.id && (
                    <div className="flex items-center gap-2.5">
                        <Hash size={11} strokeWidth={1.5} className="text-zinc-300 shrink-0" />
                        <span className="truncate">{t('pos.client_id', 'ID')}: {customer.id}</span>
                    </div>
                )}
                {customer.phone && (
                    <div className="flex items-center gap-2.5">
                        <Phone size={11} strokeWidth={1.5} className="text-zinc-300 shrink-0" />
                        <span className="truncate">{customer.phone}</span>
                    </div>
                )}
                {customer.email && (
                    <div className="flex items-center gap-2.5">
                        <Mail size={11} strokeWidth={1.5} className="text-zinc-300 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                    </div>
                )}
                {customer.address && (
                    <div className="flex items-center gap-2.5">
                        <MapPin size={11} strokeWidth={1.5} className="text-zinc-300 shrink-0" />
                        <span className="truncate">{customer.address}</span>
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-1.5 mt-3">
                <button
                    onClick={onSearch}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 rounded-xl text-xs font-medium transition-all active:scale-95"
                >
                    <Search size={12} strokeWidth={1.5} />
                    {t('pos.change', 'Change')}
                </button>
                <button
                    onClick={onEdit}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 rounded-xl text-xs font-medium transition-all active:scale-95"
                >
                    <PenLine size={12} strokeWidth={1.5} />
                    {t('pos.edit', 'Edit')}
                </button>
            </div>
        </div>
    );
}
