import { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TableSkeletonRows } from '@/components/common/TableSkeleton';
import { Plus, Search, Filter, Download, DollarSign, TrendingUp, PieChart, Wallet, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/common/Button';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import Pagination from '@/components/common/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { cn, formatCurrency } from '@/lib/utils';
import { useExpenseStore } from '@/stores/useExpenseStore';
import { exportToCsv } from '@/lib/csv';
import { toast } from 'sonner';
import ExpenseModal from '@/components/expenses/ExpenseModal';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function Expenses() {
    const { t } = useTranslation();
    usePageTitle(t('sidebar.expenses'));
    const { expenses, stats, isLoading, loadExpenses, loadStats, deleteExpense } = useExpenseStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [showFilter, setShowFilter] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadExpenses();
        loadStats();
    }, [loadExpenses, loadStats]);

    const sortedCategories = useMemo(() => [...stats.byCategory].sort((a, b) => b.total - a.total), [stats.byCategory]);

    const filteredExpenses = expenses
        .filter(
            (e) =>
                e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.category.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .filter((e) => filterCategory === 'all' || e.category === filterCategory);

    const { currentPage, totalPages, startIndex, endIndex, setCurrentPage, paginate, resetPage } = usePagination({
        totalItems: filteredExpenses.length,
    });

    useEffect(() => {
        resetPage();
    }, [searchTerm, filterCategory, resetPage]);

    const paginatedExpenses = paginate(filteredExpenses);

    const uniqueCategories = [...new Set(expenses.map((e) => e.category))];

    const handleExportExpenses = () => {
        const headers = [
            { key: 'id', label: 'ID' },
            { key: 'description', label: 'Description' },
            { key: 'category', label: 'Category' },
            { key: 'amount', label: 'Amount' },
            { key: 'date', label: 'Date' },
            { key: 'payment_method', label: 'Payment Method' },
        ];
        exportToCsv(
            headers,
            filteredExpenses as unknown as Record<string, unknown>[],
            `expenses_${new Date().toISOString().split('T')[0]}.csv`,
        );
        toast.success(t('expenses.export_success', { count: filteredExpenses.length }));
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

            <div className="relative z-10 flex-1 flex flex-col min-w-0 w-full">
                {/* Header Section */}
                <div className="flex flex-col space-y-6 pb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-[12px] text-zinc-400 tracking-[0.3em] font-bold">
                                {t('sidebar.expenses')}
                            </span>
                            <h2 className="text-3xl font-black text-black tracking-tighter uppercase">
                                {t('expenses.title')}
                            </h2>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md border border-black shadow-lg shadow-black/20 hover:bg-neutral-800 transition-all active:scale-95"
                        >
                            <Plus size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {t('expenses.add_expense')}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Total Expenses */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black text-white border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 p-24 bg-zinc-800 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {t('expenses.stat_total')}
                            </span>
                            <div className="p-2 bg-white/10 rounded-full">
                                <DollarSign size={14} className="text-white" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-white tracking-tighter">
                                    {formatCurrency(stats.total, false)}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase mt-1 block">
                                {t('expenses.stat_all_time')}
                            </span>
                        </div>
                    </motion.div>

                    {/* Top Category */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-rose-100 border-2 border-rose-200 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-rose-900/60 uppercase tracking-widest">
                                {t('expenses.stat_top_category')}
                            </span>
                            <div className="p-2 bg-rose-900/10 rounded-full">
                                <TrendingUp size={14} className="text-rose-900" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            {sortedCategories.length > 0 ? (
                                <>
                                    <span className="text-lg font-black text-rose-900 tracking-tight block truncate">
                                        {sortedCategories[0].category}
                                    </span>
                                    <span className="text-sm font-bold text-rose-900/60">
                                        {formatCurrency(sortedCategories[0].total)}
                                    </span>
                                </>
                            ) : (
                                <span className="text-sm font-bold text-rose-900/60">{t('expenses.stat_no_data')}</span>
                            )}
                        </div>
                    </motion.div>

                    {/* Categories Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {t('expenses.stat_categories')}
                            </span>
                            <div className="p-2 bg-zinc-100 rounded-full">
                                <PieChart size={14} className="text-zinc-500" />
                            </div>
                        </div>
                        <div className="relative z-10 space-y-1.5">
                            {sortedCategories.slice(0, 3).map((cat) => (
                                <div key={cat.category} className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-zinc-500 truncate">{cat.category}</span>
                                    <span className="text-xs font-black text-black">
                                        {formatCurrency(cat.total, false)}
                                    </span>
                                </div>
                            ))}
                            {sortedCategories.length === 0 && (
                                <span className="text-xs font-bold text-zinc-400">{t('expenses.stat_no_data')}</span>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Search Bar & Action Buttons */}
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
                            placeholder={t('expenses.search_placeholder')}
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

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-3.5 rounded-2xl border transition-all',
                                    filterCategory !== 'all'
                                        ? 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200'
                                        : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200 hover:text-black',
                                )}
                            >
                                <Filter size={16} />
                                <span className="text-sm font-bold">
                                    {filterCategory === 'all' ? t('expenses.filter') : filterCategory}
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
                                        <button
                                            onClick={() => {
                                                setFilterCategory('all');
                                                setShowFilter(false);
                                            }}
                                            className={cn(
                                                'w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-colors',
                                                filterCategory === 'all'
                                                    ? 'bg-black text-white'
                                                    : 'text-zinc-600 hover:bg-zinc-50',
                                            )}
                                        >
                                            {t('expenses.filter_all')}
                                        </button>
                                        {uniqueCategories.map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => {
                                                    setFilterCategory(cat);
                                                    setShowFilter(false);
                                                }}
                                                className={cn(
                                                    'w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-colors',
                                                    filterCategory === cat
                                                        ? 'bg-black text-white'
                                                        : 'text-zinc-600 hover:bg-zinc-50',
                                                )}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button
                            onClick={handleExportExpenses}
                            className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 hover:text-black transition-all text-zinc-600"
                        >
                            <Download size={16} />
                            <span className="text-sm font-bold">{t('expenses.export')}</span>
                        </button>
                    </div>
                </div>

                {/* Expenses Table */}
                <div className="rounded-[3rem] bg-white border-2 border-black/5 overflow-hidden min-h-[500px] flex flex-col">
                    <table className="w-full" dir="auto">
                        <thead className="bg-zinc-50 border-b border-zinc-100">
                            <tr>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('expenses.col_description')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('expenses.col_category')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('expenses.col_date')}
                                </th>
                                <th className="px-6 py-4 rtl:text-right ltr:text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('expenses.col_amount')}
                                </th>
                                <th className="px-6 py-4 rtl:text-left ltr:text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    {t('expenses.col_actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {isLoading ? (
                                <TableSkeletonRows columns={5} rows={5} />
                            ) : filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center">
                                                <Wallet size={24} className="text-zinc-300" />
                                            </div>
                                            <p className="text-sm font-bold text-zinc-400">
                                                {t('expenses.no_expenses')}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="px-6 py-4 rtl:text-right ltr:text-left">
                                            <span className="text-sm font-bold text-black">{expense.description}</span>
                                        </td>
                                        <td className="px-6 py-4 rtl:text-right ltr:text-left">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 rtl:text-right ltr:text-left">
                                            <span className="text-sm text-zinc-500">
                                                {new Date(expense.date).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 rtl:text-right ltr:text-left">
                                            <span className="text-sm font-black text-black">
                                                {formatCurrency(expense.amount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 rtl:text-left ltr:text-right">
                                            <button
                                                onClick={() => setDeleteTarget(expense.id)}
                                                className="text-zinc-400 hover:text-rose-500 font-bold text-[10px] uppercase tracking-wider transition-colors"
                                            >
                                                {t('expenses.delete_expense')}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="mt-auto px-6 pb-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredExpenses.length}
                            startIndex={startIndex}
                            endIndex={endIndex}
                            onPageChange={setCurrentPage}
                            itemLabel={t('expenses.title')}
                        />
                    </div>
                </div>
            </div>

            <ExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            <DeleteConfirmModal
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (deleteTarget !== null) deleteExpense(deleteTarget);
                    setDeleteTarget(null);
                }}
                title={t('expenses.delete_title')}
                description={t('expenses.delete_description')}
            />
        </div>
    );
}
