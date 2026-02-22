import { useState, useRef, useEffect, useMemo } from 'react';
import { User, Plus, X, Loader2, Search } from 'lucide-react';
import { useCustomerStore } from '@/stores/useCustomerStore';
import CustomerModal from '@/components/customers/CustomerModal';
import type { Customer } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerSelectorProps {
    onSelect: (customer: Customer | null) => void;
    selectedCustomer: Customer | null;
}

export default function CustomerSelector({ onSelect, selectedCustomer }: CustomerSelectorProps) {
    const { t } = useTranslation();
    const { customers, loadCustomers, isLoadingCustomers } = useCustomerStore();
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = useMemo(() => {
        if (!query.trim()) return customers.slice(0, 40);
        const q = query.toLowerCase();
        return customers.filter(
            (c) =>
                c.full_name.toLowerCase().includes(q) ||
                (c.phone && c.phone.includes(q)),
        ).slice(0, 40);
    }, [customers, query]);

    const handleSelect = (customer: Customer) => {
        onSelect(customer);
        setQuery('');
        setIsOpen(false);
    };

    const handleClear = () => {
        onSelect(null);
        setQuery('');
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* Selected Customer View */}
            {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-2xl animate-fadeIn">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                            {selectedCustomer.full_name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-emerald-900 leading-tight text-sm">{selectedCustomer.full_name}</p>
                            <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                                <span>{selectedCustomer.phone || t('common.no_phone')}</span>
                                <span className="w-1 h-1 rounded-full bg-emerald-300" />
                                <span>{selectedCustomer.loyalty_points} pts</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleClear}
                        className="p-2 hover:bg-emerald-100 rounded-full text-emerald-400 hover:text-emerald-700 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                /* Search Input */
                <div className="relative group">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors"
                        size={16}
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={t('pos.customer.search_placeholder', 'Search customer...')}
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
                        onFocus={() => setIsOpen(true)}
                        className="w-full pl-9 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-300 rounded-xl outline-none font-bold text-sm text-black placeholder:text-zinc-400 transition-all"
                    />
                    {isLoadingCustomers ? (
                        <Loader2
                            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-zinc-400"
                            size={15}
                        />
                    ) : (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-black transition-colors shadow-sm border border-zinc-100"
                            title="Add New Customer"
                        >
                            <Plus size={13} strokeWidth={3} />
                        </button>
                    )}

                    {/* Dropdown Results */}
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 6 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-50 max-h-[260px] overflow-y-auto"
                            >
                                {filtered.length === 0 ? (
                                    <div className="p-4 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                        {t('pos.customer.no_results', 'No customers found')}
                                    </div>
                                ) : (
                                    filtered.map((customer) => (
                                        <button
                                            key={customer.id}
                                            onClick={() => handleSelect(customer)}
                                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 transition-colors text-left border-b border-zinc-50 last:border-0"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-xs font-black text-zinc-600 shrink-0">
                                                {customer.full_name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-black truncate">{customer.full_name}</p>
                                                <p className="text-xs text-zinc-400 font-medium">{customer.phone || '—'}</p>
                                            </div>
                                            <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg shrink-0">
                                                {customer.loyalty_points} pts
                                            </div>
                                        </button>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <CustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}