// CashierReports.tsx — Cashier-specific reports page (personal shift stats, hourly chart, recent sales)
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    DollarSign,
    ShoppingCart,
    TrendingUp,
    Clock,
    Receipt,
    RefreshCw,
    BarChart3,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSaleStore } from '@/stores/useSaleStore';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { cn, formatDate } from '@/lib/utils';
import type { Sale } from '@/lib/types';

export default function CashierReports() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { formatCurrency } = useFormatCurrency();
    const user = useAuthStore((s) => s.user);
    const currentSession = useAuthStore((s) => s.currentSession);
    const { getTodayStatsForUser, getHourlyRevenue, getTopProductsByProfit } = useSaleStore();
    const recentSales = useSaleStore((s) => s.recentSales);
    const loadRecent = useSaleStore((s) => s.loadRecent);

    const [stats, setStats] = useState({ revenue: 0, orders: 0, profit: 0 });
    const [hourlyData, setHourlyData] = useState<{ time: string; revenue: number }[]>([]);
    const [topProducts, setTopProducts] = useState<{ name: string; profit: number; total_sold: number }[]>([]);
    const [loading, setLoading] = useState(true);

    const userId = user?.id;

    const loadData = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const [statsResult, hourlyResult, topResult] = await Promise.all([
                getTodayStatsForUser(userId),
                getHourlyRevenue(userId),
                getTopProductsByProfit(5, userId),
            ]);
            setStats(statsResult);
            setHourlyData(hourlyResult);
            setTopProducts(topResult);
            await loadRecent();
        } catch {
            // Silently handle
        } finally {
            setLoading(false);
        }
    }, [userId, getTodayStatsForUser, getHourlyRevenue, getTopProductsByProfit, loadRecent]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filter recent sales to current user only
    const mySales = useMemo(() =>
        recentSales.filter((s) => s.user_id === userId).slice(0, 15),
        [recentSales, userId],
    );

    // Session info
    const sessionStart = currentSession?.session?.login_time;
    const openingCash = currentSession?.session?.opening_cash ?? 0;

    return (
        <div className="h-screen w-screen flex flex-col bg-zinc-50 overflow-hidden">
            {/* Top bar */}
            <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-200 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/pos')}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-sm transition-colors"
                    >
                        <ArrowLeft size={16} />
                        {t('pos.back_to_pos', 'Back to POS')}
                    </motion.button>
                    <h1 className="text-base font-bold text-zinc-800">
                        {t('pos.cashier_reports', 'My Shift Report')}
                    </h1>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={loadData}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-medium text-sm transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {t('common.refresh', 'Refresh')}
                </motion.button>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="max-w-4xl mx-auto p-6 space-y-6">

                    {/* Session Info Banner */}
                    {sessionStart && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl"
                        >
                            <Clock size={16} className="text-blue-500" />
                            <div className="flex-1 text-sm">
                                <span className="font-semibold text-blue-800">
                                    {t('pos.report_session_started', 'Session started:')}
                                </span>{' '}
                                <span className="text-blue-600">{formatDate(sessionStart)}</span>
                            </div>
                            <div className="text-sm font-medium text-blue-600">
                                {t('pos.report_opening_cash', 'Opening Cash:')} {formatCurrency(openingCash)}
                            </div>
                        </motion.div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard
                            icon={<DollarSign size={20} />}
                            label={t('pos.report_today_revenue', "Today's Revenue")}
                            value={formatCurrency(stats.revenue)}
                            color="emerald"
                            loading={loading}
                        />
                        <StatCard
                            icon={<ShoppingCart size={20} />}
                            label={t('pos.report_today_orders', "Today's Orders")}
                            value={String(stats.orders)}
                            color="blue"
                            loading={loading}
                        />
                        <StatCard
                            icon={<TrendingUp size={20} />}
                            label={t('pos.report_today_profit', "Today's Profit")}
                            value={formatCurrency(stats.profit)}
                            color="violet"
                            loading={loading}
                        />
                    </div>

                    {/* Hourly Revenue Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 size={16} className="text-zinc-500" />
                            <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                                {t('pos.report_hourly_revenue', 'Hourly Revenue')}
                            </h2>
                        </div>
                        {hourlyData.length > 0 ? (
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={hourlyData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                                        <defs>
                                            <linearGradient id="cashierRevGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                                        <XAxis
                                            dataKey="time"
                                            tick={{ fontSize: 11, fill: '#a1a1aa' }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: '#a1a1aa' }}
                                            tickLine={false}
                                            axisLine={false}
                                            width={50}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '1px solid #e4e4e7',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                            }}
                                            formatter={(value: number) => [formatCurrency(value), t('pos.report_revenue', 'Revenue')]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            fill="url(#cashierRevGrad)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-56 flex items-center justify-center text-zinc-400 text-sm">
                                {loading
                                    ? t('common.loading', 'Loading...')
                                    : t('pos.report_no_hourly_data', 'No sales data yet for today')}
                            </div>
                        )}
                    </motion.div>

                    {/* Two-column: Top Products + Recent Sales */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Top Products */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden"
                        >
                            <div className="flex items-center gap-2 px-5 py-3 bg-zinc-50 border-b border-zinc-100">
                                <TrendingUp size={16} className="text-zinc-500" />
                                <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                                    {t('pos.report_top_products', 'Top Products')}
                                </h2>
                            </div>
                            <div className="divide-y divide-zinc-100">
                                {topProducts.length > 0 ? topProducts.map((p, idx) => (
                                    <div key={p.name} className="flex items-center gap-3 px-5 py-3">
                                        <span className={cn(
                                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                                            idx === 0 ? 'bg-amber-100 text-amber-700'
                                                : idx === 1 ? 'bg-zinc-200 text-zinc-600'
                                                : 'bg-orange-50 text-orange-500',
                                        )}>
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-zinc-800 truncate">{p.name}</p>
                                            <p className="text-xs text-zinc-400">{p.total_sold} {t('pos.report_sold', 'sold')}</p>
                                        </div>
                                        <span className="text-sm font-bold text-emerald-600">{formatCurrency(p.profit)}</span>
                                    </div>
                                )) : (
                                    <div className="px-5 py-8 text-center text-zinc-400 text-sm">
                                        {t('pos.report_no_products', 'No sales yet')}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Recent Sales */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden"
                        >
                            <div className="flex items-center gap-2 px-5 py-3 bg-zinc-50 border-b border-zinc-100">
                                <Receipt size={16} className="text-zinc-500" />
                                <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                                    {t('pos.report_recent_sales', 'Recent Sales')}
                                </h2>
                            </div>
                            <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto scrollbar-hide">
                                {mySales.length > 0 ? mySales.map((sale: Sale) => (
                                    <div key={sale.id} className="flex items-center justify-between px-5 py-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-zinc-800">
                                                    #{sale.ticket_number != null ? String(sale.ticket_number).padStart(3, '0') : sale.id}
                                                </span>
                                                <StatusBadge status={sale.status} />
                                            </div>
                                            <p className="text-xs text-zinc-400 mt-0.5">
                                                {formatDate(sale.created_at)} · {sale.customer_name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-zinc-800">{formatCurrency(sale.total)}</p>
                                            <p className="text-xs text-zinc-400 capitalize">{sale.payment_method}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="px-5 py-8 text-center text-zinc-400 text-sm">
                                        {t('pos.report_no_sales', 'No recent sales')}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                </div>
            </main>
        </div>
    );
}

/* ── Helper Components ── */

const colorMap = {
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500', value: 'text-emerald-700' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-500', value: 'text-blue-700' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-500', value: 'text-violet-700' },
} as const;

function StatCard({
    icon,
    label,
    value,
    color,
    loading,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: keyof typeof colorMap;
    loading: boolean;
}) {
    const c = colorMap[color];
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('rounded-2xl border border-zinc-200 shadow-sm p-5', c.bg)}
        >
            <div className="flex items-center gap-2 mb-3">
                <span className={c.icon}>{icon}</span>
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</span>
            </div>
            {loading ? (
                <div className="h-8 w-24 bg-zinc-200 rounded-lg animate-pulse" />
            ) : (
                <p className={cn('text-2xl font-black', c.value)}>{value}</p>
            )}
        </motion.div>
    );
}

function StatusBadge({ status }: { status: Sale['status'] }) {
    const styles = {
        completed: 'bg-emerald-100 text-emerald-700',
        refunded: 'bg-amber-100 text-amber-700',
        voided: 'bg-red-100 text-red-700',
        returned: 'bg-blue-100 text-blue-700',
    };
    return (
        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase', styles[status])}>
            {status}
        </span>
    );
}
