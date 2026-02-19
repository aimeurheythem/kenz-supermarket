import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, CreditCard, Download, Users, Banknote, Clock, Filter } from 'lucide-react';
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

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Reports() {
    const { t } = useTranslation();
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

    // Cashier metrics
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
        const headers = ['Date', 'Revenue', 'Orders'];
        const rows = salesData.map((d) => [d.date, d.revenue, d.orders]);
        const csvContent =
            'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `sales_report_${period}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportCashierReport = () => {
        const headers = [
            t('reports.tab_cashiers'),
            t('reports.cashier_total_sales'),
            t('reports.cashier_transactions'),
            t('reports.cashier_avg_order'),
            t('reports.cashier_sessions'),
        ];
        const rows = cashierPerformance.map((c) => [
            c.cashier_name,
            c.total_sales,
            c.total_transactions,
            c.average_order,
            c.total_sessions,
        ]);
        const csvContent =
            'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `cashier_report_${period}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t('reports.title')}</h1>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('reports.subtitle')}</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-[var(--color-bg-secondary)] rounded-lg p-1 border border-[var(--color-border)]">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={cn(
                                'px-4 py-2 text-sm font-medium rounded-md transition-all',
                                activeTab === 'overview'
                                    ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm'
                                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
                            )}
                        >
                            {t('reports.tab_overview')}
                        </button>
                        <button
                            onClick={() => setActiveTab('cashiers')}
                            className={cn(
                                'px-4 py-2 text-sm font-medium rounded-md transition-all',
                                activeTab === 'cashiers'
                                    ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm'
                                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
                            )}
                        >
                            {t('reports.tab_cashiers')}
                        </button>
                    </div>

                    {/* Period Selectors ... (Keep as is) */}
                    <div className="flex bg-[var(--color-bg-secondary)] rounded-lg p-1 border border-[var(--color-border)]">
                        <button
                            onClick={() => setPeriod('7days')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === '7days' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
                        >
                            {t('reports.period_7days')}
                        </button>
                        <button
                            onClick={() => setPeriod('30days')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === '30days' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
                        >
                            {t('reports.period_30days')}
                        </button>
                        <button
                            onClick={() => setPeriod('year')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === 'year' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
                        >
                            {t('reports.period_year')}
                        </button>
                    </div>
                    <Button
                        className="btn-page-action"
                        icon={<Download size={16} />}
                        onClick={activeTab === 'cashiers' ? handleExportCashierReport : handleExport}
                    >
                        {t('reports.export')}
                    </Button>
                </div>
            </div>

            {/* Overview Content */}
            {activeTab === 'overview' && (
                <>
                    {/* KPI Cards ... (Keep as is) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                    <TrendingUp size={20} className="text-orange-500" />
                                </div>
                                <p className="text-sm font-medium text-[var(--color-text-muted)]">
                                    {t('reports.kpi_revenue')}
                                </p>
                            </div>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                                {formatCurrency(totalRevenue)}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('reports.kpi_in_period')}</p>
                        </div>

                        <div className="p-5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                    <BarChart3 size={20} className="text-emerald-500" />
                                </div>
                                <p className="text-sm font-medium text-[var(--color-text-muted)]">
                                    {t('reports.kpi_orders')}
                                </p>
                            </div>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{totalOrders}</p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                {t('reports.kpi_transactions')}
                            </p>
                        </div>

                        <div className="p-5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <CreditCard size={20} className="text-blue-500" />
                                </div>
                                <p className="text-sm font-medium text-[var(--color-text-muted)]">
                                    {t('reports.kpi_avg_order')}
                                </p>
                            </div>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                                {formatCurrency(avgOrderValue)}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                {t('reports.kpi_per_transaction')}
                            </p>
                        </div>
                    </div>

                    {/* Main Chart */}
                    <div className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] h-[400px]">
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-6">
                            {t('reports.revenue_trend')}
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="var(--text-muted)"
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
                                    stroke="var(--text-muted)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => formatCurrency(Number(val))}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-primary)',
                                        borderColor: 'var(--border-default)',
                                        borderRadius: '8px',
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Products */}
                        <div className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                                {t('reports.top_products')}
                            </h3>
                            <div className="flex flex-col gap-4">
                                {topProducts.length === 0 ? (
                                    <p className="text-sm text-[var(--color-text-muted)]">{t('reports.no_data')}</p>
                                ) : (
                                    topProducts.map((product, i) => (
                                        <div key={product.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-bg-tertiary)] text-xs font-bold text-[var(--color-text-muted)]">
                                                    {i + 1}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs text-[var(--color-text-muted)]">
                                                        {t('reports.units_sold', { count: product.quantity_sold })}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                                                {formatCurrency(product.revenue)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Category Performance */}
                        <div className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                                {t('reports.sales_by_category')}
                            </h3>
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
                                                backgroundColor: 'var(--bg-primary)',
                                                borderColor: 'var(--border-default)',
                                                borderRadius: '8px',
                                            }}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Legend ... */}
                            <div className="flex flex-wrap gap-2 justify-center mt-4">
                                {categoryData.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-1.5 text-xs">
                                        <span
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="text-[var(--color-text-muted)]">{entry.name}</span>
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
                    {/* ... (Keep Cashiers content) ... */}
                    {/* Cashier Filter */}
                    <div className="flex items-center gap-3 p-4 bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)]">
                        <Filter size={18} className="text-[var(--color-text-muted)]" />
                        <span className="text-sm text-[var(--color-text-muted)]">{t('reports.filter_by_cashier')}</span>
                        <select
                            value={selectedCashier || ''}
                            onChange={(e) => setSelectedCashier(e.target.value ? parseInt(e.target.value) : null)}
                            className="bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                        >
                            <option value="">{t('reports.all_cashiers')}</option>
                            {cashiers.map((cashier) => (
                                <option key={cashier.id} value={cashier.id}>
                                    {cashier.full_name}
                                </option>
                            ))}
                        </select>
                        {selectedCashier && (
                            <button
                                onClick={() => setSelectedCashier(null)}
                                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline"
                            >
                                {t('reports.clear_filter')}
                            </button>
                        )}
                    </div>

                    {/* Cashier KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                    <Banknote size={20} className="text-emerald-500" />
                                </div>
                                <p className="text-sm font-medium text-[var(--color-text-muted)]">
                                    {t('reports.cashier_total_sales')}
                                </p>
                            </div>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                                {formatCurrency(totalCashierSales)}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                {t('reports.from_cashiers', { count: cashierPerformance.length })}
                            </p>
                        </div>
                        <div className="p-5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <BarChart3 size={20} className="text-blue-500" />
                                </div>
                                <p className="text-sm font-medium text-[var(--color-text-muted)]">
                                    {t('reports.cashier_transactions')}
                                </p>
                            </div>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                                {totalCashierTransactions}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('reports.processed')}</p>
                        </div>
                        <div className="p-5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                    <Users size={20} className="text-purple-500" />
                                </div>
                                <p className="text-sm font-medium text-[var(--color-text-muted)]">
                                    {t('reports.cashier_top')}
                                </p>
                            </div>
                            <p className="text-lg font-bold text-[var(--color-text-primary)] truncate">
                                {topCashier?.cashier_name || t('common.na')}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                {topCashier ? formatCurrency(topCashier.total_sales) : t('reports.no_sales')}
                            </p>
                        </div>
                        <div className="p-5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                    <Clock size={20} className="text-orange-500" />
                                </div>
                                <p className="text-sm font-medium text-[var(--color-text-muted)]">
                                    {t('reports.cashier_sessions')}
                                </p>
                            </div>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                                {sessionReports.length}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                {t('reports.shifts_completed')}
                            </p>
                        </div>
                    </div>
                    {/* ... Charts and Leaderboard for Cashiers (Keep as is) */}
                    <div className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] h-[350px]">
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-6">
                            {t('reports.cashier_comparison')}
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cashierPerformance} layout="vertical">
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--border-default)"
                                    horizontal={true}
                                    vertical={false}
                                />
                                <XAxis
                                    type="number"
                                    stroke="var(--text-muted)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => formatCurrency(Number(val))}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="cashier_name"
                                    stroke="var(--text-muted)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    width={100}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-primary)',
                                        borderColor: 'var(--border-default)',
                                        borderRadius: '8px',
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                    formatter={(value: any) => [formatCurrency(value || 0), t('reports.sales_tooltip')]}
                                />
                                <Bar dataKey="total_sales" fill="#f97316" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                                {t('reports.cashier_leaderboard')}
                            </h3>
                            <div className="flex flex-col gap-3">
                                {cashierPerformance.length === 0 ? (
                                    <p className="text-sm text-[var(--color-text-muted)]">
                                        {t('reports.no_cashier_data')}
                                    </p>
                                ) : (
                                    cashierPerformance.map((cashier, i) => (
                                        <div
                                            key={cashier.cashier_id}
                                            className="flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : i === 1 ? 'bg-zinc-400/20 text-zinc-400' : i === 2 ? 'bg-orange-600/20 text-orange-600' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'}`}
                                                >
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                                        {cashier.cashier_name}
                                                    </p>
                                                    <p className="text-xs text-[var(--color-text-muted)]">
                                                        {cashier.total_transactions} transactions •{' '}
                                                        {cashier.total_sessions} sessions
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                                                    {formatCurrency(cashier.total_sales)}
                                                </p>
                                                <p className="text-xs text-[var(--color-text-muted)]">
                                                    {t('reports.avg_prefix')} {formatCurrency(cashier.average_order)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
                            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                                {t('reports.recent_sessions')}
                            </h3>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {sessionReports.length === 0 ? (
                                    <p className="text-sm text-[var(--color-text-muted)]">{t('reports.no_sessions')}</p>
                                ) : (
                                    sessionReports.slice(0, 10).map((session) => (
                                        <div
                                            key={session.session_id}
                                            className="flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] rounded-lg"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                                    {session.cashier_name}
                                                </p>
                                                <p className="text-xs text-[var(--color-text-muted)]">
                                                    {formatDate(session.login_time)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                                                    {formatCurrency(session.total_sales)}
                                                </p>
                                                <p
                                                    className={`text-xs ${session.cash_difference === 0 ? 'text-emerald-400' : session.cash_difference && session.cash_difference > 0 ? 'text-emerald-400' : 'text-red-400'}`}
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
    );
}
