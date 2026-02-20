import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useReportStore } from '@/stores/useReportStore';
import { Sale } from '@/lib/types';
import SaleDetailModal from '@/components/reports/SaleDetailModal';
import Pagination from '@/components/common/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Filter, Search, ArrowUpRight, ArrowDownLeft, Clock, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { TableSkeletonRows } from '@/components/common/TableSkeleton';
import { usePageTitle } from '@/hooks/usePageTitle';
import { motion, AnimatePresence } from 'framer-motion';

export default function Transactions() {
    const { t } = useTranslation();
    usePageTitle(t('sidebar.transactions'));
    const { salesList, loadSales, refundSale, voidSale, period, setPeriod, isLoadingSales } = useReportStore();
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadSales();
    }, [period, loadSales]);

    const filteredSales = salesList.filter(
        (sale) =>
            sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.id.toString().includes(searchTerm),
    );

    const { currentPage, totalPages, startIndex, endIndex, setCurrentPage, paginate, resetPage } = usePagination({
        totalItems: filteredSales.length,
    });

    useEffect(() => {
        resetPage();
    }, [searchTerm, period, resetPage]);

    const paginatedSales = paginate(filteredSales);

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.status === 'completed' ? sale.total : 0), 0);
    const totalTransactions = filteredSales.length;
    const refundedCount = filteredSales.filter((s) => s.status === 'refunded').length;

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

            <div className="relative z-10 flex-1 flex flex-col min-w-0 w-full">
                {/* Header Section */}
                <div className="flex flex-col space-y-6 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[12px] text-zinc-400 tracking-[0.3em] font-bold">
                                {t('sidebar.transactions')}
                            </span>
                            <h2 className="text-3xl font-black text-black tracking-tighter uppercase">
                                {t('transactions.title')}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2 p-1 bg-zinc-100 rounded-xl">
                            {(['today', '7days', '30days', 'year'] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={cn(
                                        'px-4 py-2 text-sm font-bold rounded-lg transition-all',
                                        period === p
                                            ? 'bg-white text-black shadow-sm'
                                            : 'text-zinc-500 hover:text-black',
                                    )}
                                >
                                    {p === 'today'
                                        ? t('transactions.period_today')
                                        : p === '7days'
                                          ? t('transactions.period_7days')
                                          : p === '30days'
                                            ? t('transactions.period_30days')
                                            : t('transactions.period_year')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black text-white border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 p-24 bg-zinc-800 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {t('transactions.stat_revenue')}
                            </span>
                            <div className="p-2 bg-white/10 rounded-full">
                                <ArrowUpRight size={14} className="text-white" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <span className="text-2xl font-black text-white tracking-tighter">
                                {formatCurrency(totalRevenue, false)}
                            </span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-white border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {t('transactions.stat_transactions')}
                            </span>
                            <div className="p-2 bg-zinc-100 rounded-full">
                                <Clock size={14} className="text-zinc-500" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-black tracking-tighter">
                                    {totalTransactions}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Total</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-rose-100 border-2 border-rose-200 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-36 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-rose-900/60 uppercase tracking-widest">
                                {t('transactions.stat_refunded')}
                            </span>
                            <div className="p-2 bg-rose-900/10 rounded-full">
                                <ArrowDownLeft size={14} className="text-rose-900" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-rose-900 tracking-tighter">
                                    {refundedCount}
                                </span>
                                <span className="text-[10px] font-bold text-rose-900/60 uppercase">Refunds</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Search Bar & Refresh Button */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                    <div className="relative group flex-1 w-full">
                        <Search
                            size={22}
                            className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors"
                        />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('transactions.search_placeholder')}
                            className={cn(
                                'w-full pl-16 pr-16 py-4 rounded-2xl',
                                'bg-white border border-zinc-200 shadow-none',
                                'text-black placeholder:text-zinc-300 text-base font-bold',
                                'focus:outline-none focus:ring-0 focus:!outline-none focus-visible:!outline-none focus-visible:ring-0 focus:border-zinc-400 transition-all placeholder:transition-opacity focus:placeholder:opacity-50',
                            )}
                        />
                        {searchTerm && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => {
                                    setSearchTerm('');
                                    searchInputRef.current?.focus();
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-zinc-100 text-zinc-400 hover:bg-black hover:text-white transition-all duration-300"
                            >
                                <X size={16} strokeWidth={3} />
                            </motion.button>
                        )}
                    </div>

                    <button
                        onClick={() => loadSales()}
                        className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 hover:text-black transition-all text-zinc-600"
                    >
                        <Filter size={16} />
                        <span className="text-sm font-bold">{t('transactions.refresh')}</span>
                    </button>
                </div>

                {/* Transactions Table */}
                <div className="rounded-[3rem] bg-white border-2 border-black/5 overflow-hidden">
                    <table className="w-full" dir="auto">
                        <thead className="bg-zinc-50 border-b border-zinc-100">
                            <tr>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('transactions.col_id')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('transactions.col_date')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('transactions.col_customer')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('transactions.col_payment')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('transactions.col_cashier')}
                                </th>
                                <th className="px-6 py-4 rtl:text-left ltr:text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('transactions.col_total')}
                                </th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('transactions.col_status')}
                                </th>
                                <th className="px-6 py-4 rtl:text-left ltr:text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('transactions.col_actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {isLoadingSales ? (
                                <TableSkeletonRows columns={8} rows={6} />
                            ) : filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center">
                                                <ArrowUpRight size={24} className="text-zinc-300" />
                                            </div>
                                            <p className="text-sm font-bold text-zinc-400">
                                                {t('transactions.no_transactions')}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedSales.map((sale) => (
                                    <tr
                                        key={sale.id}
                                        className="group hover:bg-zinc-50 transition-colors cursor-pointer"
                                        onClick={() => setSelectedSale(sale)}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-black">#{sale.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-black">
                                                    {new Date(sale.sale_date).toLocaleDateString()}
                                                </span>
                                                <span className="text-xs text-zinc-400">
                                                    {new Date(sale.sale_date).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {sale.customer_name ? (
                                                <span className="text-sm font-medium text-zinc-600">
                                                    {sale.customer_name}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-zinc-400 italic">
                                                    {t('transactions.walk-in')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-3 py-1 rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                                                {sale.payment_method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-zinc-500">
                                                {sale.user_name || t('common.na')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-black">
                                                {formatCurrency(sale.total)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={cn(
                                                    'inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                                                    sale.status === 'completed' && 'bg-emerald-100 text-emerald-700',
                                                    sale.status === 'refunded' && 'bg-blue-100 text-blue-700',
                                                    sale.status === 'voided' && 'bg-rose-100 text-rose-700',
                                                )}
                                            >
                                                {sale.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedSale(sale);
                                                }}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-black hover:text-white transition-all"
                                            >
                                                <ArrowUpRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="px-6 pb-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredSales.length}
                            startIndex={startIndex}
                            endIndex={endIndex}
                            onPageChange={setCurrentPage}
                            itemLabel={t('transactions.title')}
                        />
                    </div>
                </div>
            </div>

            {/* Sale Detail Modal */}
            {selectedSale && (
                <SaleDetailModal
                    sale={selectedSale}
                    onClose={() => setSelectedSale(null)}
                    onRefund={refundSale}
                    onVoid={voidSale}
                />
            )}
        </div>
    );
}
