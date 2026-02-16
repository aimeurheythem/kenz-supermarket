import { useState, useRef, useEffect } from 'react';
import { Search, User, Plus, X, Loader2, Check } from 'lucide-react';
import { useCustomerStore } from '@/stores/useCustomerStore';
import CustomerModal from '@/components/customers/CustomerModal';
import { cn } from '@/lib/utils';
import type { Customer } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerSelectorProps {
    onSelect: (customer: Customer | null) => void;
    selectedCustomer: Customer | null;
}

export default function CustomerSelector({ onSelect, selectedCustomer }: CustomerSelectorProps) {
    const { t } = useTranslation();
    const { searchCustomers, loadCustomers } = useCustomerStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Customer[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial load logic if needed, but search is better
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (term: string) => {
        setQuery(term);
        if (term.length < 2) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const data = await searchCustomers(term);
            setResults(data);
            setIsOpen(true);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

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
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                            {selectedCustomer.full_name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-emerald-900 leading-tight">{selectedCustomer.full_name}</p>
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
                        <X size={18} />
                    </button>
                </div>
            ) : (
                /* Search Input */
                <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search customer (name/phone)..."
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => {
                            if (query.length >= 2) setIsOpen(true);
                        }}
                        className="w-full pl-12 pr-12 py-4 bg-zinc-50 border-2 border-transparent focus:bg-white focus:border-zinc-200 rounded-2xl outline-none font-bold text-black placeholder:text-zinc-400 transition-all"
                    />
                    {isLoading ? (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-zinc-400" size={18} />
                    ) : (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-black transition-colors shadow-sm border border-zinc-100"
                            title="Add New Customer"
                        >
                            <Plus size={16} strokeWidth={3} />
                        </button>
                    )}

                    {/* Dropdown Results */}
                    <AnimatePresence>
                        {isOpen && results.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-50 max-h-[300px] overflow-y-auto"
                            >
                                {results.map((customer) => (
                                    <button
                                        key={customer.id}
                                        onClick={() => handleSelect(customer)}
                                        className="w-full p-4 flex items-center gap-3 hover:bg-zinc-50 transition-colors text-left border-b border-zinc-50 last:border-0"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-500">
                                            {customer.full_name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-black">{customer.full_name}</p>
                                            <p className="text-xs text-zinc-400 font-medium">{customer.phone}</p>
                                        </div>
                                        <div className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">
                                            {customer.loyalty_points} pts
                                        </div>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
