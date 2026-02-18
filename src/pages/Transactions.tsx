import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useReportStore } from '@/stores/useReportStore';
import { Sale } from '@/lib/types';
import SaleDetailModal from '@/components/reports/SaleDetailModal';
import Button from '@/components/common/Button';
import { Filter, Search, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function Transactions() {
    const { t } = useTranslation();
    const { salesList, loadSales, refundSale, voidSale, period, setPeriod, isLoadingSales } = useReportStore();
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadSales();
    }, [period, loadSales]);

    // Filter sales by search term (customer name or ID)
    const filteredSales = salesList.filter(sale =>
        sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.toString().includes(searchTerm)
    );

    // Calculate quick stats
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.status === 'completed' ? sale.total : 0), 0);
    const totalTransactions = filteredSales.length;
    const refundedCount = filteredSales.filter(s => s.status === 'refunded').length;

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Transactions</h1>
                    <p className="text-zinc-400 text-sm mt-1">
                        View and manage your sales history, refunds, and voids.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-neutral-800 rounded-lg p-1 border border-neutral-700">
                        {(['today', '7days', '30days', 'year'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                    period === p
                                        ? "bg-neutral-700 text-white shadow-sm"
                                        : "text-zinc-400 hover:text-white hover:bg-neutral-700/50"
                                )}
                            >
                                {p === 'today' ? 'Today' :
                                    p === '7days' ? '7 Days' :
                                        p === '30days' ? '30 Days' : 'Year'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-800/50 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <ArrowUpRight size={18} />
                        </div>
                        <span className="text-zinc-400 text-sm font-medium">Total Revenue</span>
                    </div>
                    <div className="text-2xl font-bold text-white tracking-tight">
                        {formatCurrency(totalRevenue)}
                    </div>
                </div>

                <div className="bg-neutral-800/50 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <Clock size={18} />
                        </div>
                        <span className="text-zinc-400 text-sm font-medium">Transactions</span>
                    </div>
                    <div className="text-2xl font-bold text-white tracking-tight">
                        {totalTransactions}
                    </div>
                </div>

                <div className="bg-neutral-800/50 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                            <ArrowDownLeft size={18} />
                        </div>
                        <span className="text-zinc-400 text-sm font-medium">Refunded / Voided</span>
                    </div>
                    <div className="text-2xl font-bold text-white tracking-tight">
                        {refundedCount}
                    </div>
                </div>
            </div>

            {/* Transactions Table Card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                {/* Table Header / Toolbar */}
                <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-neutral-900/50">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                        <input
                            type="text"
                            placeholder="Search ID or Customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-neutral-600 transition-colors"
                        />
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => loadSales()} icon={<Filter size={14} className="mr-1" />}>
                        Refresh List
                    </Button>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-800/50 text-zinc-400 border-b border-neutral-800">
                            <tr>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Payment</th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Cashier</th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">Total</th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {isLoadingSales ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-zinc-500">
                                        Loading transactions...
                                    </td>
                                </tr>
                            ) : filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-zinc-500">
                                        No transactions found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredSales.map((sale) => (
                                    <tr
                                        key={sale.id}
                                        className="group hover:bg-neutral-800/50 transition-colors cursor-pointer"
                                        onClick={() => setSelectedSale(sale)}
                                    >
                                        <td className="px-6 py-4 font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors">#{sale.id}</td>
                                        <td className="px-6 py-4 text-zinc-300">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">{new Date(sale.sale_date).toLocaleDateString()}</span>
                                                <span className="text-zinc-600 text-xs">{new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-300">
                                            {sale.customer_name ? (
                                                <span className="text-white">{sale.customer_name}</span>
                                            ) : (
                                                <span className="text-zinc-600 italic">Walk-in</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400 capitalize">
                                            <span className="px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-xs">
                                                {sale.payment_method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400 text-xs">{sale.user_name || 'N/A'}</td>
                                        <td className="px-6 py-4 text-right font-bold text-white font-mono">
                                            {formatCurrency(sale.total)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                                sale.status === 'completed'
                                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                    : sale.status === 'refunded'
                                                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                                        : "bg-red-500/10 text-red-500 border-red-500/20"
                                            )}>
                                                {sale.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
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
                <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 flex justify-between items-center text-xs text-zinc-500">
                    <span>Showing {filteredSales.length} transactions</span>
                    <span>Most recent 100 records</span>
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
