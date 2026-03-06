// CustomerSearchDialog.tsx — Search & select customer, or add new, from POS
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, UserPlus, Phone, Mail, CircleUser, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomerStore } from '@/stores/useCustomerStore';
import CustomerModal from '@/components/customers/CustomerModal';
import type { Customer } from '@/lib/types';

interface CustomerSearchDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (customer: Customer) => void;
}

export default function CustomerSearchDialog({ isOpen, onClose, onSelect }: CustomerSearchDialogProps) {
    const { t } = useTranslation();
    const { customers, loadCustomers, searchCustomers, isLoadingCustomers } = useCustomerStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Customer[]>([]);
    const [showAddNew, setShowAddNew] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load customers on open
    useEffect(() => {
        if (isOpen) {
            loadCustomers();
            setQuery('');
            setResults([]);
        }
    }, [isOpen, loadCustomers]);

    // Focus input on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Search as user types
    const handleSearch = useCallback(async (value: string) => {
        setQuery(value);
        if (value.trim().length === 0) {
            setResults([]);
            return;
        }
        try {
            const found = await searchCustomers(value.trim());
            setResults(found);
        } catch {
            // Fallback: filter local customers
            const q = value.toLowerCase();
            setResults(
                customers.filter(
                    (c) =>
                        c.full_name.toLowerCase().includes(q) ||
                        c.phone?.toLowerCase().includes(q) ||
                        c.email?.toLowerCase().includes(q),
                ),
            );
        }
    }, [searchCustomers, customers]);

    const handleSelect = (customer: Customer) => {
        onSelect(customer);
        onClose();
    };

    const handleAddNewClose = () => {
        setShowAddNew(false);
        // Reload customers so the new one shows up
        loadCustomers();
    };

    if (!isOpen) return null;

    const displayList = query.trim() ? results : customers;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 w-full max-w-lg mx-4 flex flex-col max-h-[80vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-4">
                        <h2 className="text-lg font-bold text-zinc-800">
                            {t('pos.customer_search', 'Search Customer')}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-all"
                        >
                            <X size={18} strokeWidth={1.5} />
                        </button>
                    </div>

                    {/* Search input */}
                    <div className="px-6 pb-4">
                        <div className="relative">
                            <Search size={16} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder={t('pos.search_customer_placeholder', 'Search by name, phone, or email...')}
                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-700 placeholder:text-zinc-300 text-sm font-medium focus:outline-none focus:border-zinc-200 focus:bg-white transition-colors"
                            />
                        </div>
                    </div>

                    {/* Results */}
                    <div className="flex-1 min-h-0 overflow-y-auto px-6">
                        {isLoadingCustomers ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 size={24} className="animate-spin text-zinc-300" />
                            </div>
                        ) : displayList.length > 0 ? (
                            <div className="space-y-1.5 pb-4">
                                {displayList.map((customer) => (
                                    <button
                                        key={customer.id}
                                        onClick={() => handleSelect(customer)}
                                        className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-zinc-50 transition-all text-left active:scale-[0.98]"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                                            <CircleUser size={20} strokeWidth={1.5} className="text-zinc-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-zinc-800 truncate">
                                                {customer.full_name}
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                {customer.phone && (
                                                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                                                        <Phone size={10} strokeWidth={1.5} />
                                                        {customer.phone}
                                                    </span>
                                                )}
                                                {customer.email && (
                                                    <span className="flex items-center gap-1 text-xs text-zinc-400 truncate">
                                                        <Mail size={10} strokeWidth={1.5} />
                                                        {customer.email}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : query.trim() ? (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-300">
                                <CircleUser size={32} strokeWidth={1} className="mb-3 text-zinc-200" />
                                <div className="text-sm font-medium text-zinc-400">
                                    {t('pos.no_customers_found', 'No customers found')}
                                </div>
                                <div className="text-xs text-zinc-300 mt-1">
                                    {t('pos.try_different_search', 'Try a different search or add a new customer')}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-300">
                                <Search size={28} strokeWidth={1} className="mb-3 text-zinc-200" />
                                <div className="text-xs font-medium text-zinc-400">
                                    {t('pos.type_to_search', 'Type to search customers')}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer — Add new button */}
                    <div className="px-6 py-4 border-t border-zinc-100">
                        <button
                            onClick={() => setShowAddNew(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold transition-all active:scale-[0.98]"
                        >
                            <UserPlus size={16} strokeWidth={1.5} />
                            {t('pos.add_new_customer', 'Add New Customer')}
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Add new customer modal */}
            <CustomerModal
                isOpen={showAddNew}
                onClose={handleAddNewClose}
            />
        </>
    );
}
