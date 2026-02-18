import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { TableSkeletonRows } from '@/components/common/TableSkeleton';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Filter,
    Download,
    MoreHorizontal,
    AlertCircle,
    CheckCircle2,
    Clock,
    Banknote,
    Users
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { toast } from 'sonner';
import { exportToCsv } from '@/lib/csv';
import type { Customer } from '@/lib/types';
import Button from '@/components/common/Button';
import Portal from '@/components/common/Portal';

export default function Credit() {
    const { t } = useTranslation();
    const { getDebtors, makePayment, loadTransactions, transactions } = useCustomerStore();

    // State
    const [debtors, setDebtors] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDebtor, setSelectedDebtor] = useState<Customer | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'high' | 'low'>('all');
    const [showFilter, setShowFilter] = useState(false);

    // Initial Load
    useEffect(() => {
        loadDebtors();
    }, []);

    const loadDebtors = async () => {
        setIsLoading(true);
        try {
            const data = await getDebtors();
            setDebtors(data);
        } catch (error) {
            console.error('Failed to load debtors:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Derived State
    const totalOutstanding = debtors.reduce((sum, c) => sum + (c.total_debt || 0), 0);
    const debtorCount = debtors.length;
    const filteredDebtors = debtors.filter(c =>
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
    ).filter(c => {
        if (filterStatus === 'high') return c.total_debt >= 10000;
        if (filterStatus === 'low') return c.total_debt < 10000;
        return true;
    });

    const handleExport = () => {
        const headers = [
            { key: 'id', label: 'ID' },
            { key: 'full_name', label: 'Customer Name' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'total_debt', label: 'Total Debt' },
        ];
        exportToCsv(headers, filteredDebtors as unknown as Record<string, unknown>[], `credit_report_${new Date().toISOString().split('T')[0]}.csv`);
        toast.success(`Exported ${filteredDebtors.length} debtor records`);
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-10">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Outstanding Card */}
                <div className="col-span-1 md:col-span-2 relative overflow-hidden bg-black rounded-[2.5rem] p-8 text-white min-h-[220px] flex flex-col justify-between group">
                    <div className="absolute top-0 right-0 p-32 bg-zinc-900 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 group-hover:bg-zinc-800 transition-colors duration-700" />

                    <div className="relative z-10 flex items-start justify-between">
                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                            <Wallet size={24} className="text-white" />
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/5">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Active Debts</span>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-2">
                        <span className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em]">Total Outstanding</span>
                        <div className="flex items-baseline gap-1">
                            <h2 className="text-5xl lg:text-7xl font-black tracking-tighter">
                                {formatCurrency(totalOutstanding)}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 flex flex-col justify-between h-[calc(50%-12px)]">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                                <Users size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Debtors</span>
                        </div>
                        <span className="text-4xl font-black text-black tracking-tighter">{debtorCount}</span>
                    </div>
                    <div className="bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100 flex flex-col justify-between h-[calc(50%-12px)]">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white text-emerald-500 rounded-2xl shadow-sm">
                                <CheckCircle2 size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Collection Health</span>
                        </div>
                        <span className="text-4xl font-black text-emerald-700 tracking-tighter">Good</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[3rem] border border-zinc-100 overflow-hidden min-h-[500px]">
                {/* Toolbar */}
                <div className="p-8 pb-0 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search debtors..."
                            className="w-full h-14 pl-14 pr-6 bg-zinc-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-black/5 transition-all font-bold placeholder:font-medium placeholder:text-zinc-400"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Button variant="secondary" icon={<Filter size={18} />} onClick={() => setShowFilter(!showFilter)}>
                                {filterStatus === 'all' ? 'Filter' : filterStatus === 'high' ? 'High Debt' : 'Low Debt'}
                            </Button>
                            {showFilter && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl border border-zinc-100 shadow-xl z-50 p-2">
                                    {[
                                        { key: 'all' as const, label: 'All Debtors' },
                                        { key: 'high' as const, label: 'High Debt (≥10k)' },
                                        { key: 'low' as const, label: 'Low Debt (<10k)' },
                                    ].map(opt => (
                                        <button
                                            key={opt.key}
                                            onClick={() => { setFilterStatus(opt.key); setShowFilter(false); }}
                                            className={cn(
                                                "w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-colors",
                                                filterStatus === opt.key ? "bg-black text-white" : "text-zinc-600 hover:bg-zinc-50"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Button variant="secondary" icon={<Download size={18} />} onClick={handleExport}>Export</Button>
                    </div>
                </div>

                {/* Table */}
                <div className="p-8">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-zinc-100">
                                    <th className="pb-6 pl-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Customer</th>
                                    <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Contact</th>
                                    <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Total Debt</th>
                                    <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Status</th>
                                    <th className="pb-6 pr-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {isLoading ? (
                                    <TableSkeletonRows columns={5} rows={5} />
                                ) : filteredDebtors.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-50">
                                                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center">
                                                    <CheckCircle2 size={32} className="text-zinc-400 ml-1" />
                                                </div>
                                                <p className="font-bold text-zinc-400">No active debts found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDebtors.map((debtor) => (
                                        <tr key={debtor.id} className="group hover:bg-zinc-50/80 transition-colors">
                                            <td className="py-6 pl-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center font-black text-zinc-500 uppercase">
                                                        {debtor.full_name.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-black">{debtor.full_name}</div>
                                                        <div className="text-xs font-medium text-zinc-400">ID: #{debtor.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-zinc-600">{debtor.phone || '—'}</span>
                                                    <span className="text-xs text-zinc-400">{debtor.email}</span>
                                                </div>
                                            </td>
                                            <td className="py-6">
                                                <span className="text-lg font-black text-black">
                                                    {formatCurrency(debtor.total_debt)}
                                                </span>
                                            </td>
                                            <td className="py-6">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100">
                                                    <AlertCircle size={14} className="text-red-500" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-red-600">Overdue</span>
                                                </div>
                                            </td>
                                            <td className="py-6 pr-4 text-right">
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedDebtor(debtor);
                                                        setShowPaymentModal(true);
                                                    }}
                                                >
                                                    Settle Debt
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <AnimatePresence>
                {showPaymentModal && selectedDebtor && (
                    <PaymentModal
                        customer={selectedDebtor}
                        onClose={() => {
                            setShowPaymentModal(false);
                            setSelectedDebtor(null);
                        }}
                        onSuccess={() => {
                            loadDebtors();
                            setShowPaymentModal(false);
                            setSelectedDebtor(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function PaymentModal({ customer, onClose, onSuccess }: { customer: Customer, onClose: () => void, onSuccess: () => void }) {
    const { makePayment } = useCustomerStore();
    const [amount, setAmount] = useState(customer.total_debt.toString());
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await makePayment(customer.id, parseFloat(amount));
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Payment failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden"
                >
                    <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                        <div>
                            <h2 className="text-xl font-black text-black">Record Payment</h2>
                            <p className="text-sm font-medium text-zinc-400">for {customer.full_name}</p>
                        </div>
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <Banknote size={24} className="text-emerald-500" />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        <div className="space-y-4">
                            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex justify-between items-center">
                                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total Due</span>
                                <span className="text-xl font-black text-red-500">{formatCurrency(customer.total_debt)}</span>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Payment Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-400">DZ</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full h-16 pl-10 pr-4 rounded-2xl bg-white border-2 border-zinc-100 text-2xl font-black text-black focus:border-black focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading} className="flex-1">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black border-none shadow-lg shadow-yellow-400/20">
                                {isLoading ? 'Processing...' : 'Confirm Payment'}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </Portal>
    );
}
