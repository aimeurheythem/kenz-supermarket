import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TableSkeletonRows } from '@/components/common/TableSkeleton';
import { Plus, Search, Filter, Download, DollarSign, TrendingUp, PieChart, Wallet } from 'lucide-react';
import Button from '@/components/common/Button';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import Pagination from '@/components/common/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { cn, formatCurrency } from '@/lib/utils';
import { useExpenseStore } from '@/stores/useExpenseStore';
import { exportToCsv } from '@/lib/csv';
import { toast } from 'sonner';
import ExpenseModal from '@/components/expenses/ExpenseModal';

export default function Expenses() {
    const { t } = useTranslation();
    const { expenses, stats, isLoading, loadExpenses, loadStats, deleteExpense } = useExpenseStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [showFilter, setShowFilter] = useState(false);

    useEffect(() => {
        loadExpenses();
        loadStats();
    }, [loadExpenses, loadStats]);

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

    // Reset page when filters change
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
        <div className="space-y-8 animate-fadeIn pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-black tracking-tight">{t('expenses.title')}</h1>
                    <p className="text-zinc-500 font-medium mt-1">{t('expenses.subtitle')}</p>
                </div>
                <Button className="btn-page-action" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
                    {t('expenses.add_expense')}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black text-white rounded-[2rem] p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-24 bg-zinc-800 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                                <DollarSign size={20} />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest opacity-60">
                                {t('expenses.stat_total')}
                            </span>
                        </div>
                        <div className="flex items-end gap-2">
                            <h2 className="text-5xl font-black tracking-tighter">{formatCurrency(stats.total)}</h2>
                            <span className="text-zinc-400 font-bold mb-2">{t('expenses.stat_all_time')}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-zinc-100 rounded-[2rem] p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                            {t('expenses.stat_top_category')}
                        </span>
                    </div>
                    {stats.byCategory.length > 0 ? (
                        <div>
                            <h3 className="text-2xl font-black text-black mb-1">
                                {stats.byCategory.sort((a, b) => b.total - a.total)[0].category}
                            </h3>
                            <p className="text-zinc-400 font-medium">
                                {formatCurrency(stats.byCategory.sort((a, b) => b.total - a.total)[0].total)}
                            </p>
                        </div>
                    ) : (
                        <p className="text-zinc-400 font-medium">{t('expenses.stat_no_data')}</p>
                    )}
                </div>

                <div className="bg-white border border-zinc-100 rounded-[2rem] p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                            <PieChart size={20} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                            {t('expenses.stat_categories')}
                        </span>
                    </div>
                    <div className="space-y-3">
                        {stats.byCategory.slice(0, 3).map((cat) => (
                            <div key={cat.category} className="flex items-center justify-between">
                                <span className="font-bold text-zinc-600 text-sm">{cat.category}</span>
                                <span className="font-bold text-black text-sm">{formatCurrency(cat.total)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden min-h-[500px]">
                {/* Toolbar */}
                <div className="p-8 pb-0 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="relative w-full md:w-96 group">
                        <Search
                            className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black transition-colors"
                            size={20}
                        />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('expenses.search_placeholder')}
                            className="w-full h-14 pl-14 pr-6 bg-zinc-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-black/5 transition-all font-bold placeholder:font-medium placeholder:text-zinc-400"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Button
                                variant="secondary"
                                icon={<Filter size={18} />}
                                onClick={() => setShowFilter(!showFilter)}
                            >
                                {filterCategory === 'all' ? t('expenses.filter') : filterCategory}
                            </Button>
                            {showFilter && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl border border-zinc-100 shadow-xl z-50 p-2">
                                    <button
                                        onClick={() => {
                                            setFilterCategory('all');
                                            setShowFilter(false);
                                        }}
                                        className={cn(
                                            'w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-colors',
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
                                                'w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-colors',
                                                filterCategory === cat
                                                    ? 'bg-black text-white'
                                                    : 'text-zinc-600 hover:bg-zinc-50',
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Button variant="secondary" icon={<Download size={18} />} onClick={handleExportExpenses}>
                            {t('expenses.export')}
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="p-8">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-zinc-100">
                                    <th className="pb-6 pl-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                        {t('expenses.col_description')}
                                    </th>
                                    <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                        {t('expenses.col_category')}
                                    </th>
                                    <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                        {t('expenses.col_date')}
                                    </th>
                                    <th className="pb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                        {t('expenses.col_amount')}
                                    </th>
                                    <th className="pb-6 pr-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                        {t('expenses.col_actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {isLoading ? (
                                    <TableSkeletonRows columns={5} rows={5} />
                                ) : filteredExpenses.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-50">
                                                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center">
                                                    <Wallet size={32} className="text-zinc-400" />
                                                </div>
                                                <p className="font-bold text-zinc-400">{t('expenses.no_expenses')}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedExpenses.map((expense) => (
                                        <tr key={expense.id} className="group hover:bg-zinc-50/80 transition-colors">
                                            <td className="py-6 pl-4">
                                                <span className="font-bold text-black">{expense.description}</span>
                                            </td>
                                            <td className="py-6">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="py-6">
                                                <span className="text-sm font-medium text-zinc-500">
                                                    {new Date(expense.date).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="py-6">
                                                <span className="font-black text-black">
                                                    {formatCurrency(expense.amount)}
                                                </span>
                                            </td>
                                            <td className="py-6 pr-4 text-right">
                                                <button
                                                    onClick={() => setDeleteTarget(expense.id)}
                                                    className="text-zinc-400 hover:text-red-500 font-bold text-xs uppercase tracking-wide transition-colors"
                                                >
                                                    {t('expenses.delete_expense')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="px-8">
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
