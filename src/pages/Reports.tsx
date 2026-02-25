import { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BarChart3,
    TrendingUp,
    CreditCard,
    Download,
    Users,
    Banknote,
    Clock,
    Filter,
    Search,
    X,
    TrendingDown,
    DollarSign,
    Receipt,
    Activity,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useReportStore } from '@/stores/useReportStore';
import { useUserStore } from '@/stores/useUserStore';
import Button from '@/components/common/Button';
import { exportToCsv } from '@/lib/csv';
import { toast } from 'sonner';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Reports() {
    const { t } = useTranslation();
    usePageTitle(t('sidebar.reports'));
    const {
        period,
        setPeriod,
        salesData,
        topProducts,
        categoryData,
        cashierPerformance,
        sessionReports,
        selectedCashier,
        setSelectedCashier,
        loadReports,
        loadCashierReports,
    } = useReportStore();
    const { users, loadUsers } = useUserStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'cashiers'>('overview');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadReports();
        loadCashierReports();
        loadUsers();
    }, [loadReports, loadCashierReports, loadUsers]);

    const cashiers = useMemo(() => {
        return users.filter((u) => u.role === 'cashier' && u.is_active === 1);
    }, [users]);

    const totalRevenue = useMemo(() => salesData.reduce((acc, curr) => acc + curr.revenue, 0), [salesData]);
    const totalOrders = useMemo(() => salesData.reduce((acc, curr) => acc + curr.orders, 0), [salesData]);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const totalCashierSales = useMemo(
        () => cashierPerformance.reduce((acc, curr) => acc + curr.total_sales, 0),
        [cashierPerformance],
    );
    const totalCashierTransactions = useMemo(
        () => cashierPerformance.reduce((acc, curr) => acc + curr.total_transactions, 0),
        [cashierPerformance],
    );
    const topCashier = useMemo(() => cashierPerformance[0], [cashierPerformance]);

    const handleExport = () => {
        const headers = [
            { key: 'date', label: t('reports.col_date', 'Date') },
            { key: 'revenue', label: t('reports.col_revenue', 'Revenue') },
            { key: 'orders', label: t('reports.col_orders', 'Orders') },
        ];
        exportToCsv(headers, salesData as unknown as Record<string, unknown>[], `sales_report_${period}.csv`);
        toast.success(t('reports.export_success', { count: salesData.length }));
    };

    const handleExportCashierReport = () => {
        const headers = [
            { key: 'cashier_name', label: t('reports.tab_cashiers') },
            { key: 'total_sales', label: t('reports.cashier_total_sales') },
            { key: 'total_transactions', label: t('reports.cashier_transactions') },
            { key: 'average_order', label: t('reports.cashier_avg_order') },
            { key: 'total_sessions', label: t('reports.cashier_sessions') },
        ];
        exportToCsv(
            headers,
            cashierPerformance as unknown as Record<string, unknown>[],
            `cashier_report_${period}.csv`,
        );
        toast.success(t('reports.export_cashier_success', { count: cashierPerformance.length }));
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
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[12px] text-zinc-400 tracking-[0.3em] font-bold">
                                {t('sidebar.reports')}
                            </span>
                            <h2 className="text-3xl font-black text-black tracking-tighter uppercase">
                                {t('reports.title')}
                            </h2>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Tabs */}
                            <div className="flex bg-zinc-100 rounded-xl p-1">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={cn(
                                        'px-4 py-2.5 text-sm font-bold rounded-lg transition-all',
                                        activeTab === 'overview'
                                            ? 'bg-white text-black shadow-sm'
                                            : 'text-zinc-500 hover:text-black',
                                    )}
                                >
                                    {t('reports.tab_overview')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('cashiers')}
                                    className={cn(
                                        'px-4 py-2.5 text-sm font-bold rounded-lg transition-all',
                                        activeTab === 'cashiers'
                                            ? 'bg-white text-black shadow-sm'
                                            : 'text-zinc-500 hover:text-black',
                                    )}
                                >
                                    {t('reports.tab_cashiers')}
                                </button>
                            </div>

                            {/* Period */}
                            <div className="flex bg-zinc-100 rounded-xl p-1">
                                {(['7days', '30days', 'year'] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={cn(
                                            'px-3 py-2 text-xs font-bold rounded-lg transition-all',
                                            period === p
                                                ? 'bg-white text-black shadow-sm'
                                                : 'text-zinc-500 hover:text-black',
                                        )}
                                    >
                                        {p === '7days'
                                            ? t('reports.period_7days')
                                            : p === '30days'
                                                ? t('reports.period_30days')
                                                : t('reports.period_year')}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={activeTab === 'cashiers' ? handleExportCashierReport : handleExport}
                                className="flex items-center gap-2 px-5 py-3 bg-yellow-400 hover:bg-yellow-300 text-black rounded-[3rem] font-black uppercase tracking-widest text-xs transition-all"
                            >
                                <Download size={18} strokeWidth={3} />
                                <span>
                                    {t('reports.export')}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <>
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
                                        {t('reports.kpi_revenue')}
                                    </span>
                                    <div className="p-2 bg-white/10 rounded-full">
                                        <TrendingUp size={14} className="text-white" />
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
                                className="bg-emerald-100 border-2 border-emerald-200 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <span className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest">
                                        {t('reports.kpi_orders')}
                                    </span>
                                    <div className="p-2 bg-emerald-500/10 rounded-full">
                                        <Receipt size={14} className="text-emerald-700" />
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <span className="text-2xl font-black text-emerald-800 tracking-tighter">
                                        {totalOrders}
                                    </span>
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
                                        {t('reports.kpi_avg_order')}
                                    </span>
                                    <div className="p-2 bg-zinc-100 rounded-full">
                                        <DollarSign size={14} className="text-zinc-500" />
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <span className="text-2xl font-black text-black tracking-tighter">
                                        {formatCurrency(avgOrderValue, false)}
                                    </span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Main Chart */}
                        <div className="rounded-[3rem] bg-white border-2 border-black/5 p-6 lg:p-8 mb-8">
                            <h3 className="text-lg font-bold text-black mb-6">{t('reports.revenue_trend')}</h3>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={salesData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#a1a1aa"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => {
                                                const d = new Date(val);
                                                return period === 'year'
                                                    ? d.toLocaleDateString('en-US', { month: 'short' })
                                                    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                            }}
                                        />
                                        <YAxis
                                            stroke="#a1a1aa"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => formatCurrency(Number(val))}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e4e4e7',
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                            }}
                                            itemStyle={{ color: '#18181b' }}
                                            formatter={(value: any) => [
                                                formatCurrency(value || 0),
                                                t('reports.cashier_revenue'),
                                            ]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#f97316"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Products */}
                            <div className="rounded-[3rem] bg-white border-2 border-black/5 p-6 lg:p-8">
                                <h3 className="text-lg font-bold text-black mb-6">{t('reports.top_products')}</h3>
                                <div className="flex flex-col gap-4">
                                    {topProducts.length === 0 ? (
                                        <p className="text-sm text-zinc-400">{t('reports.no_data')}</p>
                                    ) : (
                                        topProducts.map((product, i) => (
                                            <div
                                                key={product.id}
                                                className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-black">{product.name}</p>
                                                        <p className="text-xs text-zinc-400">
                                                            {t('reports.units_sold', { count: product.quantity_sold })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-black text-black">
                                                    {formatCurrency(product.revenue)}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Category Performance */}
                            <div className="rounded-[3rem] bg-white border-2 border-black/5 p-6 lg:p-8">
                                <h3 className="text-lg font-bold text-black mb-6">{t('reports.sales_by_category')}</h3>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #e4e4e7',
                                                    borderRadius: '12px',
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-wrap gap-3 justify-center mt-4">
                                    {categoryData.map((entry, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-full"
                                        >
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <span className="text-xs font-medium text-zinc-600">{entry.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Cashiers Tab */}
                {activeTab === 'cashiers' && (
                    <>
                        {/* Cashier Filter */}
                        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-zinc-200 mb-8">
                            <Filter size={18} className="text-zinc-400" />
                            <span className="text-sm font-medium text-zinc-500">{t('reports.filter_by_cashier')}</span>
                            <Select
                                value={selectedCashier ? String(selectedCashier) : 'all'}
                                onValueChange={(v) => setSelectedCashier(v === 'all' ? null : parseInt(v))}
                            >
                                <SelectTrigger className="w-[180px] h-10 bg-zinc-50 border-zinc-200 rounded-xl !ring-0 font-medium text-sm">
                                    <SelectValue placeholder={t('reports.all_cashiers')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('reports.all_cashiers')}</SelectItem>
                                    {cashiers.map((cashier) => (
                                        <SelectItem key={cashier.id} value={String(cashier.id)}>
                                            {cashier.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedCashier && (
                                <button
                                    onClick={() => setSelectedCashier(null)}
                                    className="text-xs font-medium text-zinc-400 hover:text-black underline"
                                >
                                    {t('reports.clear_filter')}
                                </button>
                            )}
                        </div>

                        {/* Cashier KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-black text-white border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                            >
                                <div className="absolute top-0 right-0 p-24 bg-zinc-800 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
                                <div className="flex items-center justify-between relative z-10">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        {t('reports.cashier_total_sales')}
                                    </span>
                                    <div className="p-2 bg-white/10 rounded-full">
                                        <Banknote size={14} className="text-white" />
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <span className="text-2xl font-black text-white tracking-tighter">
                                        {formatCurrency(totalCashierSales, false)}
                                    </span>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                                className="bg-blue-100 border-2 border-blue-200 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <span className="text-[10px] font-bold text-blue-700/60 uppercase tracking-widest">
                                        {t('reports.cashier_transactions')}
                                    </span>
                                    <div className="p-2 bg-blue-500/10 rounded-full">
                                        <BarChart3 size={14} className="text-blue-700" />
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <span className="text-2xl font-black text-blue-800 tracking-tighter">
                                        {totalCashierTransactions}
                                    </span>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-yellow-300 border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <span className="text-[10px] font-bold text-black/60 uppercase tracking-widest">
                                        {t('reports.cashier_top')}
                                    </span>
                                    <div className="p-2 bg-black/5 rounded-full">
                                        <Users size={14} className="text-black" />
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-lg font-black text-black truncate">
                                        {topCashier?.cashier_name || '-'}
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="bg-white border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[3rem] relative overflow-hidden group cursor-pointer"
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        {t('reports.cashier_sessions')}
                                    </span>
                                    <div className="p-2 bg-zinc-100 rounded-full">
                                        <Clock size={14} className="text-zinc-500" />
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <span className="text-2xl font-black text-black tracking-tighter">
                                        {sessionReports.length}
                                    </span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Bar Chart */}
                        <div className="rounded-[3rem] bg-white border-2 border-black/5 p-6 lg:p-8 mb-8">
                            <h3 className="text-lg font-bold text-black mb-6">{t('reports.cashier_comparison')}</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cashierPerformance} layout="vertical">
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#f4f4f5"
                                            horizontal={true}
                                            vertical={false}
                                        />
                                        <XAxis
                                            type="number"
                                            stroke="#a1a1aa"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => formatCurrency(Number(val))}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="cashier_name"
                                            stroke="#a1a1aa"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            width={100}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e4e4e7',
                                                borderRadius: '12px',
                                            }}
                                            formatter={(value: any) => [
                                                formatCurrency(value || 0),
                                                t('reports.sales_tooltip'),
                                            ]}
                                        />
                                        <Bar dataKey="total_sales" fill="#f97316" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Leaderboard */}
                            <div className="rounded-[3rem] bg-white border-2 border-black/5 p-6 lg:p-8">
                                <h3 className="text-lg font-bold text-black mb-6">
                                    {t('reports.cashier_leaderboard')}
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {cashierPerformance.length === 0 ? (
                                        <p className="text-sm text-zinc-400">{t('reports.no_cashier_data')}</p>
                                    ) : (
                                        cashierPerformance.map((cashier, i) => (
                                            <div
                                                key={cashier.cashier_id}
                                                className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={cn(
                                                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                                                            i === 0
                                                                ? 'bg-yellow-400 text-black'
                                                                : i === 1
                                                                    ? 'bg-zinc-300 text-black'
                                                                    : i === 2
                                                                        ? 'bg-orange-300 text-black'
                                                                        : 'bg-zinc-200 text-zinc-600',
                                                        )}
                                                    >
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-black">
                                                            {cashier.cashier_name}
                                                        </p>
                                                        <p className="text-xs text-zinc-400">
                                                            {cashier.total_transactions} transactions
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-black">
                                                        {formatCurrency(cashier.total_sales)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Recent Sessions */}
                            <div className="rounded-[3rem] bg-white border-2 border-black/5 p-6 lg:p-8">
                                <h3 className="text-lg font-bold text-black mb-6">{t('reports.recent_sessions')}</h3>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {sessionReports.length === 0 ? (
                                        <p className="text-sm text-zinc-400">{t('reports.no_sessions')}</p>
                                    ) : (
                                        sessionReports.slice(0, 10).map((session) => (
                                            <div
                                                key={session.session_id}
                                                className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl"
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-black">
                                                        {session.cashier_name}
                                                    </p>
                                                    <p className="text-xs text-zinc-400">
                                                        {formatDate(session.login_time)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-black">
                                                        {formatCurrency(session.total_sales)}
                                                    </p>
                                                    <p
                                                        className={cn(
                                                            'text-xs',
                                                            session.cash_difference === 0
                                                                ? 'text-emerald-500'
                                                                : session.cash_difference && session.cash_difference > 0
                                                                    ? 'text-emerald-500'
                                                                    : 'text-red-500',
                                                        )}
                                                    >
                                                        {session.status === 'active'
                                                            ? t('reports.session_active')
                                                            : session.cash_difference !== null
                                                                ? `${t('reports.session_diff')} ${formatCurrency(session.cash_difference)}`
                                                                : t('reports.session_closed')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
