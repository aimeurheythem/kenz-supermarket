import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { TableSkeletonRows } from '@/components/common/TableSkeleton';
import {
    Wallet,
    Search,
    Filter,
    Download,
    AlertCircle,
    CheckCircle2,
    Banknote,
    Users,
    TrendingUp,
    X,
} from 'lucide-react';
import { cn, formatCurrency, validatePaymentAmount } from '@/lib/utils';
import { useCustomerStore } from '@/stores/useCustomerStore';
import { toast } from 'sonner';
import { exportToCsv } from '@/lib/csv';
import type { Customer } from '@/lib/types';
import Button from '@/components/common/Button';
import Portal from '@/components/common/Portal';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function Credit() {
    const { t } = useTranslation();
    usePageTitle(t('sidebar.credit'));
    const { getDebtors, getCollectionStats } = useCustomerStore();

    const [debtors, setDebtors] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [collectionRate, setCollectionRate] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDebtor, setSelectedDebtor] = useState<Customer | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | 'high' | 'low'>('all');
    const [showFilter, setShowFilter] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const loadDebtors = useCallback(async () => {
        setIsLoading(true);
        try {
            const [data, stats] = await Promise.all([getDebtors(), getCollectionStats()]);
            setDebtors(data);
            const rate = stats.totalDebted > 0 ? (stats.totalCollected / stats.totalDebted) * 100 : 100;
            setCollectionRate(Math.min(rate, 100));
        } catch (error) {
            console.error('Failed to load debtors:', error);
        } finally {
            setIsLoading(false);
        }
    }, [getDebtors, getCollectionStats]);

    useEffect(() => {
        loadDebtors();
    }, [loadDebtors]);

    const totalOutstanding = debtors.reduce((sum, c) => sum + (c.total_debt || 0), 0);
    const debtorCount = debtors.length;
    const filteredDebtors = debtors
        .filter((c) => c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone?.includes(searchQuery))
        .filter((c) => {
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
        exportToCsv(
            headers,
            filteredDebtors as unknown as Record<string, unknown>[],
            `credit_report_${new Date().toISOString().split('T')[0]}.csv`,
        );
        toast.success(t('credit.export_success', { count: filteredDebtors.length }));
    };

    return (
        <div className="relative flex flex-col items-start gap-8 p-6 lg:p-8 animate-fadeIn mt-4">
            {/* Grid Background */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.15] rounded-[3rem]"
                style={{
                    backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                    maskImage: 'radial-gradient(circle at top center, black, transparent 90%)',
                    WebkitMaskImage: 'radial-gradient(circle at top center, black, transparent 90%)',
                }}
            />

            <div className="relative z-10 flex-1 w-full">
                {/* Header Section */}
                <div className="flex flex-col space-y-6 pb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-[12px] text-zinc-400 tracking-[0.3em] font-bold">
                                {t('sidebar.credit')}
                            </span>
                            <h2 className="text-3xl font-black text-black tracking-tighter uppercase">
                                {t('credit.title')}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black text-white border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 p-24 bg-zinc-800 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {t('credit.total_outstanding')}
                            </span>
                            <div className="p-2 bg-white/10 rounded-full">
                                <Wallet size={14} className="text-white" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <span className="text-2xl font-black text-white tracking-tighter">
                                {formatCurrency(totalOutstanding, false)}
                            </span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-rose-100 border-2 border-rose-200 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-rose-900/60 uppercase tracking-widest">
                                {t('credit.total_debtors')}
                            </span>
                            <div className="p-2 bg-rose-900/10 rounded-full">
                                <Users size={14} className="text-rose-900" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <span className="text-2xl font-black text-rose-900 tracking-tighter">{debtorCount}</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {t('credit.collection_health')}
                            </span>
                            <div
                                className={cn(
                                    'p-2 rounded-full',
                                    collectionRate !== null && collectionRate >= 70
                                        ? 'bg-emerald-100'
                                        : collectionRate !== null && collectionRate >= 40
                                          ? 'bg-amber-100'
                                          : 'bg-red-100',
                                )}
                            >
                                <TrendingUp
                                    size={14}
                                    className={cn(
                                        '',
                                        collectionRate !== null && collectionRate >= 70
                                            ? 'text-emerald-600'
                                            : collectionRate !== null && collectionRate >= 40
                                              ? 'text-amber-600'
                                              : 'text-red-600',
                                    )}
                                />
                            </div>
                        </div>
                        <div className="relative z-10 space-y-2">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-black tracking-tighter">
                                    {collectionRate !== null ? `${collectionRate.toFixed(0)}%` : '—'}
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all duration-700',
                                        collectionRate !== null && collectionRate >= 70
                                            ? 'bg-emerald-500'
                                            : collectionRate !== null && collectionRate >= 40
                                              ? 'bg-amber-500'
                                              : 'bg-red-500',
                                    )}
                                    style={{ width: `${collectionRate ?? 0}%` }}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col lg:flex-row items-center gap-4 mb-6">
                    <div className="relative group flex-1 w-full">
                        <Search
                            size={22}
                            className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors"
                        />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('credit.search_placeholder')}
                            className={cn(
                                'w-full pl-16 pr-16 py-4 rounded-2xl',
                                'bg-white border border-zinc-200 shadow-none',
                                'text-black placeholder:text-zinc-300 text-base font-bold',
                                'focus:outline-none focus:ring-0 focus:!outline-none focus-visible:!outline-none focus-visible:ring-0 focus:border-zinc-400 transition-all placeholder:transition-opacity focus:placeholder:opacity-50',
                            )}
                        />
                        {searchQuery && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => {
                                    setSearchQuery('');
                                    searchInputRef.current?.focus();
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-zinc-100 text-zinc-400 hover:bg-black hover:text-white transition-all duration-300"
                            >
                                <X size={16} strokeWidth={3} />
                            </motion.button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-3.5 rounded-2xl border transition-all',
                                    filterStatus !== 'all'
                                        ? 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200'
                                        : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200 hover:text-black',
                                )}
                            >
                                <Filter size={16} />
                                <span className="text-sm font-bold">
                                    {filterStatus === 'all'
                                        ? t('credit.filter')
                                        : filterStatus === 'high'
                                          ? t('credit.high_debt')
                                          : t('credit.low_debt')}
                                </span>
                            </button>
                            <AnimatePresence>
                                {showFilter && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                        className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl border border-zinc-200 shadow-xl z-50 p-2"
                                    >
                                        {[
                                            { key: 'all' as const, label: t('credit.filter_all') },
                                            { key: 'high' as const, label: t('credit.filter_high') },
                                            { key: 'low' as const, label: t('credit.filter_low') },
                                        ].map((opt) => (
                                            <button
                                                key={opt.key}
                                                onClick={() => {
                                                    setFilterStatus(opt.key);
                                                    setShowFilter(false);
                                                }}
                                                className={cn(
                                                    'w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-colors',
                                                    filterStatus === opt.key
                                                        ? 'bg-black text-white'
                                                        : 'text-zinc-600 hover:bg-zinc-50',
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 hover:text-black transition-all text-zinc-600"
                        >
                            <Download size={16} />
                            <span className="text-sm font-bold">{t('credit.export')}</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-[3rem] bg-white border-2 border-black/5 overflow-hidden min-h-[500px]">
                    <table className="w-full" dir="auto">
                        <thead className="bg-zinc-50 border-b border-zinc-100">
                            <tr>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('credit.col_customer')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('credit.col_contact')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('credit.col_debt')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('credit.col_status')}
                                </th>
                                <th className="px-6 py-4 rtl:text-left ltr:text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('credit.col_actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {isLoading ? (
                                <TableSkeletonRows columns={5} rows={5} />
                            ) : filteredDebtors.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center">
                                                <CheckCircle2 size={24} className="text-zinc-300" />
                                            </div>
                                            <p className="text-sm font-bold text-zinc-400">{t('credit.no_debts')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredDebtors.map((debtor) => (
                                    <tr key={debtor.id} className="group hover:bg-zinc-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 uppercase text-xs">
                                                    {debtor.full_name.slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-black">{debtor.full_name}</p>
                                                    <p className="text-xs text-zinc-400">ID: #{debtor.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-zinc-600">
                                                    {debtor.phone || '—'}
                                                </span>
                                                <span className="text-xs text-zinc-400">{debtor.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-black">
                                                {formatCurrency(debtor.total_debt)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100">
                                                <AlertCircle size={12} className="text-red-500" />
                                                <span className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                                                    {t('credit.status_overdue')}
                                                </span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedDebtor(debtor);
                                                    setShowPaymentModal(true);
                                                }}
                                                className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-800 transition-all"
                                            >
                                                {t('credit.settle_debt')}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
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

function PaymentModal({
    customer,
    onClose,
    onSuccess,
}: {
    customer: Customer;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const { makePayment } = useCustomerStore();
    const { t } = useTranslation();
    const [amount, setAmount] = useState(customer.total_debt.toString());
    const [isLoading, setIsLoading] = useState(false);

    const parsedAmount = parseFloat(amount);
    const amountValidation = validatePaymentAmount(parsedAmount, customer.total_debt, t);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amountValidation.valid) {
            toast.error(amountValidation.message);
            return;
        }
        setIsLoading(true);
        try {
            await makePayment(customer.id, parsedAmount);
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error(t('credit.payment_failed'));
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
                    <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-black">{t('credit.record_payment')}</h2>
                            <p className="text-xs font-medium text-zinc-400">
                                {t('credit.payment_for', { name: customer.full_name })}
                            </p>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-xl">
                            <Banknote size={20} className="text-emerald-600" />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="p-4 bg-zinc-50 rounded-xl flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                {t('credit.total_due')}
                            </span>
                            <span className="text-lg font-black text-red-500">
                                {formatCurrency(customer.total_debt)}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
                                {t('credit.payment_amount')}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
                                    DZ
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={customer.total_debt}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className={cn(
                                        'w-full h-12 pl-10 pr-4 rounded-xl bg-white border-2 text-base font-bold text-black focus:outline-none transition-colors',
                                        !amountValidation.valid && amount
                                            ? 'border-red-300 focus:border-red-500'
                                            : 'border-zinc-200 focus:border-zinc-400',
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 rounded-xl"
                            >
                                {t('credit.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || !amountValidation.valid}
                                className="flex-1 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black border-none"
                            >
                                {isLoading ? t('credit.processing') : t('credit.confirm_payment')}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </Portal>
    );
}
