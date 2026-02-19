import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useReportStore } from '@/stores/useReportStore';
import { Sale } from '@/lib/types';
import SaleDetailModal from '@/components/reports/SaleDetailModal';
import Button from '@/components/common/Button';
import { Filter, Search, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { TableSkeletonRows } from '@/components/common/TableSkeleton';

export default function Transactions() {
    const { t } = useTranslation();
    const { salesList, loadSales, refundSale, voidSale, period, setPeriod, isLoadingSales } = useReportStore();
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadSales();
    }, [period, loadSales]);

    // Filter sales by search term (customer name or ID)
    const filteredSales = salesList.filter(
        (sale) =>
            sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.id.toString().includes(searchTerm),
    );

    // Calculate quick stats
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.status === 'completed' ? sale.total : 0), 0);
    const totalTransactions = filteredSales.length;
    const refundedCount = filteredSales.filter((s) => s.status === 'refunded').length;

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
                        {t('transactions.title')}
                    </h1>
                    <p className="text-[var(--color-text-muted)] text-sm mt-1">{t('transactions.subtitle')}</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-[var(--color-bg-secondary)] rounded-lg p-1 border border-[var(--color-border)]">
                        {(['today', '7days', '30days', 'year'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                                    period === p
                                        ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm'
                                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]',
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-border-hover)] transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <ArrowUpRight size={18} />
                        </div>
                        <span className="text-[var(--color-text-muted)] text-sm font-medium">
                            {t('transactions.stat_revenue')}
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
                        {formatCurrency(totalRevenue)}
                    </div>
                </div>

                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-border-hover)] transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <Clock size={18} />
                        </div>
                        <span className="text-[var(--color-text-muted)] text-sm font-medium">
                            {t('transactions.stat_transactions')}
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
                        {totalTransactions}
                    </div>
                </div>

                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-border-hover)] transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                            <ArrowDownLeft size={18} />
                        </div>
                        <span className="text-[var(--color-text-muted)] text-sm font-medium">
                            {t('transactions.stat_refunded')}
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
                        {refundedCount}
                    </div>
                </div>
            </div>

            {/* Transactions Table Card */}
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
                {/* Table Header / Toolbar */}
                <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[var(--color-bg-secondary)]">
                    <div className="relative w-full sm:w-64">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                            size={14}
                        />
                        <input
                            type="text"
                            placeholder={t('transactions.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] focus:outline-none focus:border-[var(--color-border-hover)] transition-colors"
                        />
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => loadSales()}
                        icon={<Filter size={14} className="mr-1" />}
                    >
                        {t('transactions.refresh')}
                    </Button>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                            <tr>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                                    {t('transactions.col_id')}
                                </th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                                    {t('transactions.col_date')}
                                </th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                                    {t('transactions.col_customer')}
                                </th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                                    {t('transactions.col_payment')}
                                </th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                                    {t('transactions.col_cashier')}
                                </th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">
                                    {t('transactions.col_total')}
                                </th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-center">
                                    {t('transactions.col_status')}
                                </th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">
                                    {t('transactions.col_actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {isLoadingSales ? (
                                <TableSkeletonRows columns={8} rows={6} />
                            ) : filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                                        {t('transactions.no_transactions')}
                                    </td>
                                </tr>
                            ) : (
                                filteredSales.map((sale) => (
                                    <tr
                                        key={sale.id}
                                        className="group hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
                                        onClick={() => setSelectedSale(sale)}
                                    >
                                        <td className="px-6 py-4 font-mono text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors">
                                            #{sale.id}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                                            <div className="flex flex-col">
                                                <span className="text-[var(--color-text-primary)] font-medium">
                                                    {new Date(sale.sale_date).toLocaleDateString()}
                                                </span>
                                                <span className="text-[var(--color-text-muted)] text-xs">
                                                    {new Date(sale.sale_date).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[var(--color-text-secondary)]">
                                            {sale.customer_name ? (
                                                <span className="text-[var(--color-text-primary)]">
                                                    {sale.customer_name}
                                                </span>
                                            ) : (
                                                <span className="text-[var(--color-text-muted)] italic">
                                                    {t('transactions.walk_in')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--color-text-muted)] capitalize">
                                            <span className="px-2 py-0.5 rounded-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs">
                                                {sale.payment_method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[var(--color-text-muted)] text-xs">
                                            {sale.user_name || t('common.na')}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-[var(--color-text-primary)] font-mono">
                                            {formatCurrency(sale.total)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={cn(
                                                    'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                                                    sale.status === 'completed'
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        : sale.status === 'refunded'
                                                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                          : 'bg-red-500/10 text-red-500 border-red-500/20',
                                                )}
                                            >
                                                {sale.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedSale(sale);
                                                }}
                                            >
                                                <ArrowUpRight size={16} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination (Placeholder) */}
                <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex justify-between items-center text-xs text-[var(--color-text-muted)]">
                    <span>{t('transactions.showing', { count: filteredSales.length })}</span>
                    <span>{t('transactions.recent_records')}</span>
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
