import { useEffect, useMemo, useState } from 'react';
import {
    BarChart3,
    TrendingUp,
    CreditCard,
    PieChart as PieChartIcon,
    Download,
    Users,
    DollarSign,
    Clock,
    Calendar,
    Filter,
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { useReportStore } from '@/stores/useReportStore';
import { useUserStore } from '@/stores/useUserStore';
import Button from '@/components/common/Button';
import type { User } from '@/lib/types';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Reports() {
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
        loadCashierReports 
    } = useReportStore();
    const { users, loadUsers } = useUserStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'cashiers'>('overview');

    useEffect(() => {
        loadReports();
        loadCashierReports();
        loadUsers();
    }, []);

    const cashiers = useMemo(() => {
        return users.filter(u => u.role === 'cashier' && u.is_active === 1);
    }, [users]);

    const totalRevenue = useMemo(() => salesData.reduce((acc, curr) => acc + curr.revenue, 0), [salesData]);
    const totalOrders = useMemo(() => salesData.reduce((acc, curr) => acc + curr.orders, 0), [salesData]);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Cashier metrics
    const totalCashierSales = useMemo(() => cashierPerformance.reduce((acc, curr) => acc + curr.total_sales, 0), [cashierPerformance]);
    const totalCashierTransactions = useMemo(() => cashierPerformance.reduce((acc, curr) => acc + curr.total_transactions, 0), [cashierPerformance]);
    const topCashier = useMemo(() => cashierPerformance[0], [cashierPerformance]);

    const handleExport = () => {
        const headers = ['Date', 'Revenue', 'Orders'];
        const rows = salesData.map(d => [d.date, d.revenue, d.orders]);
        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `sales_report_${period}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportCashierReport = () => {
        const headers = ['Cashier', 'Total Sales', 'Transactions', 'Avg Order', 'Sessions'];
        const rows = cashierPerformance.map(c => [
            c.cashier_name,
            c.total_sales,
            c.total_transactions,
            c.average_order,
            c.total_sessions
        ]);
        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `cashier_report_${period}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Performance metrics and sales insights
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-neutral-800 rounded-lg p-1 border border-neutral-700">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                activeTab === 'overview' 
                                    ? 'bg-neutral-700 text-white' 
                                    : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('cashiers')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                activeTab === 'cashiers' 
                                    ? 'bg-neutral-700 text-white' 
                                    : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            Cashiers
                        </button>
                    </div>
                    <div className="flex bg-neutral-800 rounded-lg p-1 border border-neutral-700">
                        <button
                            onClick={() => setPeriod('7days')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === '7days' ? 'bg-neutral-700 text-white' : 'text-zinc-400 hover:text-white'}`}
                        >
                            7 Days
                        </button>
                        <button
                            onClick={() => setPeriod('30days')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === '30days' ? 'bg-neutral-700 text-white' : 'text-zinc-400 hover:text-white'}`}
                        >
                            30 Days
                        </button>
                        <button
                            onClick={() => setPeriod('year')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === 'year' ? 'bg-neutral-700 text-white' : 'text-zinc-400 hover:text-white'}`}
                        >
                            Year
                        </button>
                    </div>
                    <Button variant="secondary" icon={<Download size={16} />} onClick={activeTab === 'cashiers' ? handleExportCashierReport : handleExport}>
                        Export
                    </Button>
                </div>
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                    <TrendingUp size={20} className="text-orange-500" />
                                </div>
                                <p className="text-sm font-medium text-zinc-400">Total Revenue</p>
                            </div>
                            <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
                            <p className="text-xs text-zinc-500 mt-1">in selected period</p>
                        </div>

                        <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                    <BarChart3 size={20} className="text-emerald-500" />
                                </div>
                                <p className="text-sm font-medium text-zinc-400">Total Orders</p>
                            </div>
                            <p className="text-2xl font-bold text-white">{totalOrders}</p>
                            <p className="text-xs text-zinc-500 mt-1">transactions processed</p>
                        </div>

                        <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <CreditCard size={20} className="text-blue-500" />
                                </div>
                                <p className="text-sm font-medium text-zinc-400">Avg. Order Value</p>
                            </div>
                            <p className="text-2xl font-bold text-white">{formatCurrency(avgOrderValue)}</p>
                            <p className="text-xs text-zinc-500 mt-1">per transaction</p>
                        </div>
                    </div>

                    {/* Main Chart */}
                    <div className="p-6 rounded-xl bg-neutral-800 border border-neutral-700 h-[400px]">
                        <h3 className="text-sm font-semibold text-white mb-6">Revenue Trend</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#71717a"
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
                                    stroke="#71717a"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: number | undefined) => [formatCurrency(value || 0), 'Revenue']}
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
                        <div className="p-6 rounded-xl bg-neutral-800 border border-neutral-700">
                            <h3 className="text-sm font-semibold text-white mb-4">Top Selling Products</h3>
                            <div className="flex flex-col gap-4">
                                {topProducts.length === 0 ? (
                                    <p className="text-sm text-zinc-500">No sales data yet.</p>
                                ) : (
                                    topProducts.map((product, i) => (
                                        <div key={product.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-700 text-xs font-bold text-zinc-400">
                                                    {i + 1}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{product.name}</p>
                                                    <p className="text-xs text-zinc-500">{product.quantity_sold} units sold</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-semibold text-white">
                                                {formatCurrency(product.revenue)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Category Performance */}
                        <div className="p-6 rounded-xl bg-neutral-800 border border-neutral-700">
                            <h3 className="text-sm font-semibold text-white mb-4">Sales by Category</h3>
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
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center mt-4">
                                {categoryData.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-1.5 text-xs">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-zinc-400">{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'cashiers' && (
                <>
                    {/* Cashier Filter */}
                    <div className="flex items-center gap-3 p-4 bg-neutral-800 rounded-xl border border-neutral-700">
                        <Filter size={18} className="text-zinc-400" />
                        <span className="text-sm text-zinc-400">Filter by Cashier:</span>
                        <select
                            value={selectedCashier || ''}
                            onChange={(e) => setSelectedCashier(e.target.value ? parseInt(e.target.value) : null)}
                            className="bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500"
                        >
                            <option value="">All Cashiers</option>
                            {cashiers.map((cashier) => (
                                <option key={cashier.id} value={cashier.id}>
                                    {cashier.full_name}
                                </option>
                            ))}
                        </select>
                        {selectedCashier && (
                            <button
                                onClick={() => setSelectedCashier(null)}
                                className="text-xs text-zinc-400 hover:text-white underline"
                            >
                                Clear filter
                            </button>
                        )}
                    </div>

                    {/* Cashier KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                    <DollarSign size={20} className="text-emerald-500" />
                                </div>
                                <p className="text-sm font-medium text-zinc-400">Cashier Sales</p>
                            </div>
                            <p className="text-2xl font-bold text-white">{formatCurrency(totalCashierSales)}</p>
                            <p className="text-xs text-zinc-500 mt-1">from {cashierPerformance.length} cashiers</p>
                        </div>

                        <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <BarChart3 size={20} className="text-blue-500" />
                                </div>
                                <p className="text-sm font-medium text-zinc-400">Transactions</p>
                            </div>
                            <p className="text-2xl font-bold text-white">{totalCashierTransactions}</p>
                            <p className="text-xs text-zinc-500 mt-1">processed</p>
                        </div>

                        <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                    <Users size={20} className="text-purple-500" />
                                </div>
                                <p className="text-sm font-medium text-zinc-400">Top Performer</p>
                            </div>
                            <p className="text-lg font-bold text-white truncate">
                                {topCashier?.cashier_name || 'N/A'}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                                {topCashier ? formatCurrency(topCashier.total_sales) : 'No sales'}
                            </p>
                        </div>

                        <div className="p-5 rounded-xl bg-neutral-800 border border-neutral-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                    <Clock size={20} className="text-orange-500" />
                                </div>
                                <p className="text-sm font-medium text-zinc-400">Total Sessions</p>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {sessionReports.length}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">shifts completed</p>
                        </div>
                    </div>

                    {/* Cashier Performance Chart */}
                    <div className="p-6 rounded-xl bg-neutral-800 border border-neutral-700 h-[350px]">
                        <h3 className="text-sm font-semibold text-white mb-6">Cashier Performance Comparison</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cashierPerformance} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={true} vertical={false} />
                                <XAxis
                                    type="number"
                                    stroke="#71717a"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="cashier_name"
                                    stroke="#71717a"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    width={100}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: number | undefined) => [formatCurrency(value || 0), 'Sales']}
                                />
                                <Bar dataKey="total_sales" fill="#f97316" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Cashier Leaderboard */}
                        <div className="p-6 rounded-xl bg-neutral-800 border border-neutral-700">
                            <h3 className="text-sm font-semibold text-white mb-4">Cashier Leaderboard</h3>
                            <div className="flex flex-col gap-3">
                                {cashierPerformance.length === 0 ? (
                                    <p className="text-sm text-zinc-500">No cashier sales data yet.</p>
                                ) : (
                                    cashierPerformance.map((cashier, i) => (
                                        <div key={cashier.cashier_id} className="flex items-center justify-between p-3 bg-neutral-700/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                    i === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                                    i === 1 ? 'bg-zinc-400/20 text-zinc-400' :
                                                    i === 2 ? 'bg-orange-600/20 text-orange-600' :
                                                    'bg-neutral-600 text-zinc-400'
                                                }`}>
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{cashier.cashier_name}</p>
                                                    <p className="text-xs text-zinc-500">
                                                        {cashier.total_transactions} transactions • {cashier.total_sessions} sessions
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-white">{formatCurrency(cashier.total_sales)}</p>
                                                <p className="text-xs text-zinc-500">Avg: {formatCurrency(cashier.average_order)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Recent Sessions */}
                        <div className="p-6 rounded-xl bg-neutral-800 border border-neutral-700">
                            <h3 className="text-sm font-semibold text-white mb-4">Recent Sessions</h3>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {sessionReports.length === 0 ? (
                                    <p className="text-sm text-zinc-500">No sessions recorded.</p>
                                ) : (
                                    sessionReports.slice(0, 10).map((session) => (
                                        <div key={session.session_id} className="flex items-center justify-between p-3 bg-neutral-700/50 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-white">{session.cashier_name}</p>
                                                <p className="text-xs text-zinc-500">
                                                    {formatDate(session.login_time)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-white">{formatCurrency(session.total_sales)}</p>
                                                <p className={`text-xs ${
                                                    session.cash_difference === 0 ? 'text-emerald-400' :
                                                    session.cash_difference && session.cash_difference > 0 ? 'text-emerald-400' :
                                                    'text-red-400'
                                                }`}>
                                                    {session.status === 'active' ? 'Active' : 
                                                     session.cash_difference !== null ? `Diff: ${formatCurrency(session.cash_difference)}` : 'Closed'}
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
