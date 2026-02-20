import React, { useEffect, useState, useMemo } from 'react';
import {
    Banknote,
    Package,
    ArrowRight,
    Hand,
    ShoppingBasket,
    MonitorCog,
    Container,
    CloudUpload,
    TrendingUp,
    Award,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatCurrency, getCurrencySymbol } from '@/lib/utils';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProductStore } from '@/stores/useProductStore';
import { useSaleStore } from '@/stores/useSaleStore';
import { useExpenseStore } from '@/stores/useExpenseStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/useAuthStore';
import type { User } from '@/lib/types';
import CashierSelector from '@/components/dashboard/CashierSelector';
import RecentSales from '@/components/dashboard/RecentSales';
import SalesAnalytics from '@/components/dashboard/SalesAnalytics';

// Rank-based color palette for Top Products carousel
const RANK_COLORS = [
    { color: 'bg-amber-400/20', iconColor: 'text-amber-500' }, // #1 Gold
    { color: 'bg-slate-300/30', iconColor: 'text-slate-500' }, // #2 Silver
    { color: 'bg-orange-400/20', iconColor: 'text-orange-600' }, // #3 Bronze
    { color: 'bg-sky-400/20', iconColor: 'text-sky-500' }, // #4
    { color: 'bg-emerald-400/20', iconColor: 'text-emerald-500' }, // #5
];

// Dashboard Component - Main Entry Point
export default function Dashboard() {
    const { products, lowStockProducts, loadProducts, loadLowStock } = useProductStore();
    const { todayStats, loadRecent, loadTodayStats, getTopProductsByProfit, getTodayStatsForUser } = useSaleStore();
    const { stats: expenseStats, loadStats: loadExpenseStats } = useExpenseStore();
    const { user: authUser } = useAuthStore();
    const [selectedCashier, setSelectedCashier] = useState<User | null>(null);
    const [activeProductIndex, setActiveProductIndex] = useState(0);
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    usePageTitle(t('sidebar.dashboard'));

    // Real Top Products by Profit
    const [topProducts, setTopProducts] = useState<{ name: string; profit: number; total_sold: number }[]>([]);
    // Local today stats for cashier filtering
    const [localTodayStats, setLocalTodayStats] = useState<{ revenue: number; orders: number; profit: number } | null>(
        null,
    );

    const cashierUserId = selectedCashier?.id;

    useEffect(() => {
        getTopProductsByProfit(5, cashierUserId).then(setTopProducts).catch(console.error);
    }, [cashierUserId, getTopProductsByProfit]);

    useEffect(() => {
        if (topProducts.length === 0) return;
        const interval = setInterval(() => {
            setActiveProductIndex((prev) => (prev + 1) % topProducts.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [topProducts.length]);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        loadProducts();
        loadLowStock();
        loadRecent();
        loadTodayStats();
        loadExpenseStats(today, today);
    }, [loadProducts, loadLowStock, loadRecent, loadTodayStats, loadExpenseStats]);

    // Refetch today stats when cashier changes
    useEffect(() => {
        if (cashierUserId) {
            getTodayStatsForUser(cashierUserId).then(setLocalTodayStats).catch(console.error);
        } else {
            setLocalTodayStats(null);
        }
    }, [cashierUserId, getTodayStatsForUser]);

    // Data for Stats — use cashier-filtered stats when a cashier is selected
    const effectiveStats = localTodayStats || todayStats;
    const totalRevenue = effectiveStats.revenue;
    const netProfit = effectiveStats.profit - (localTodayStats ? 0 : expenseStats.total);
    const totalProducts = products.length;

    // Data for Shortcuts
    const shortcuts = useMemo(() => [
        { label: t('dashboard.shortcuts.pos'), icon: MonitorCog, path: '/pos', color: 'text-white', bg: 'bg-black' },
        {
            label: t('dashboard.shortcuts.inventory'),
            icon: ShoppingBasket,
            path: '/inventory',
            color: 'text-white',
            bg: 'bg-black',
        },
        {
            label: t('dashboard.shortcuts.suppliers'),
            icon: Container,
            path: '/suppliers',
            color: 'text-white',
            bg: 'bg-black',
        },
        {
            label: t('dashboard.shortcuts.reports'),
            icon: CloudUpload,
            path: '/reports',
            color: 'text-white',
            bg: 'bg-black',
        },
    ], [t]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('dashboard.welcome_card.greeting_morning');
        if (hour < 17) return t('dashboard.welcome_card.greeting_afternoon');
        return t('dashboard.welcome_card.greeting_evening');
    };

    const displayUser = selectedCashier || authUser;

    return (
        <div className="space-y-8 animate-fadeIn pb-12 h-full flex flex-col mt-8">
            {/* NEW: Welcome Card (Full Width) */}
            <div className="relative overflow-hidden bg-white border-2 border-gray-200 p-8 rounded-[4rem] animate-fadeIn flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300">
                {/* Grid Background */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-40"
                    style={{
                        backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 1px, transparent 1px)`,
                        backgroundSize: '32px 32px',
                        maskImage: 'radial-gradient(circle at top center, black, transparent 80%)',
                        WebkitMaskImage: 'radial-gradient(circle at top center, black, transparent 80%)',
                    }}
                />

                <div className="relative z-10 flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <span className="text-[15px] text-black uppercase tracking-[0.3em] mb-1">
                            {t('dashboard.decorative_label')}
                        </span>
                        <CashierSelector selectedCashier={selectedCashier} onSelect={setSelectedCashier} />
                    </div>
                    <h2 className="text-3xl font-bold text-black tracking-tight font-sans flex items-center gap-3">
                        {getGreeting()}, {displayUser?.full_name || 'User'}!
                        <div className="bg-yellow-100 p-2 rounded-full transform hover:rotate-12 transition-transform duration-300">
                            <Hand className="w-8 h-8 text-yellow-500 rotate-[20deg]" strokeWidth={2.5} />
                        </div>
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium">{t('dashboard.welcome_card.message')}</p>
                </div>

                {/* Right Side Content: Minimal Date/Time */}
                <div className="relative z-10 flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-black">
                            {t('dashboard.welcome_card.current_time')}
                        </span>
                        <div className="text-2xl text-black font-sans py-1">
                            {new Date().toLocaleTimeString(i18n.language, {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                            })}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-black uppercase tracking-wider">
                                {t('dashboard.welcome_card.system_live')}
                            </span>
                        </div>
                    </div>
                    <div className="hidden lg:flex flex-col items-center justify-center bg-white/20 w-14 h-14 rounded-2xl group-hover:bg-white/10 transition-colors">
                        <span className="text-[10px] font-black text-black uppercase leading-none">
                            {new Date().toLocaleDateString(i18n.language, { month: 'short' })}
                        </span>
                        <span className="text-xl font-black text-black leading-none mt-1">
                            {new Date().toLocaleDateString(i18n.language, { day: '2-digit' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Layout Grid: 70% Left, 30% Right */}
            <div className="grid grid-cols-1 xl:grid-cols-10 gap-6 flex-1 min-h-0">
                {/* LEFT SECTION (70%) */}
                <div className="xl:col-span-7 space-y-6 flex flex-col">
                    {/* 1. Recent Sales */}
                    <RecentSales />

                    {/* 2. Shortcuts Grid (Moved here) */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold text-black tracking-tight">
                            {t('dashboard.shortcuts.title')}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {shortcuts.map((shortcut) => (
                                <div
                                    key={shortcut.label}
                                    onClick={() => navigate(shortcut.path)}
                                    className={cn(
                                        'p-6 rounded-[30px] transition-all duration-500 ease-out cursor-pointer group relative overflow-hidden',
                                        'bg-[linear-gradient(to_bottom,black_50%,#ffee00_50%)] bg-[length:100%_250%] bg-no-repeat bg-top hover:bg-bottom',
                                    )}
                                >
                                    {/* Content Layer */}
                                    <div className="relative z-10 flex items-center justify-between gap-3 w-full group-hover:text-black transition-colors duration-300 pointer-events-none">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-white/10 group-hover:bg-black/10 transition-colors duration-300">
                                                <shortcut.icon className="w-5 h-5 text-white group-hover:text-black transition-colors duration-300" />
                                            </div>
                                            <span className="text-white text-md font-medium group-hover:text-black transition-colors duration-300">
                                                {shortcut.label}
                                            </span>
                                        </div>
                                        <ArrowRight
                                            size={14}
                                            className="text-white/20 group-hover:text-black/60 transition-colors duration-300 ease-in-out group-hover:-rotate-45"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. Sales Analytics Section */}
                    <SalesAnalytics userId={cashierUserId} />
                </div>
                <div className="xl:col-span-3 h-full flex flex-col gap-6">
                    {/* Revenue, Profit & Stock Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-6">
                        {/* Revenue Card */}
                        <motion.div className="bg-white border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[2.5rem] relative overflow-hidden group cursor-pointer">
                            <div className="flex items-center justify-between relative z-10">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                    {t('dashboard.stats.today_revenue')}
                                </span>
                                <div className="p-2 bg-zinc-100 rounded-full">
                                    <Banknote size={16} className="text-black" />
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-black tracking-tighter">
                                        {formatCurrency(totalRevenue, false)}
                                    </span>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase">
                                        {getCurrencySymbol()}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Net Profit Card */}
                        <motion.div className="bg-black text-white flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[2.5rem] relative overflow-hidden group cursor-pointer">
                            <div className="absolute top-0 right-0 p-16 bg-zinc-800 rounded-full blur-2xl opacity-20 -translate-y-1/2 translate-x-1/2" />

                            <div className="flex items-center justify-between relative z-10">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                    Net Profit
                                </span>
                                <div className="p-2 bg-white/10 rounded-full">
                                    <TrendingUp size={16} className="text-white" />
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-white tracking-tighter">
                                        {formatCurrency(netProfit, false)}
                                    </span>
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">
                                        {getCurrencySymbol()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-zinc-400">
                                        Gross: {formatCurrency(todayStats.profit)}
                                    </span>
                                    <span className="text-[10px] text-zinc-400">•</span>
                                    <span className="text-[10px] text-zinc-400">
                                        Exp: {formatCurrency(expenseStats.total)}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Stock Card */}
                        <motion.div className="bg-yellow-300 border-2 border-black/10 flex flex-col justify-between aspect-[2/1] md:aspect-auto md:h-40 p-6 rounded-[2.5rem] relative overflow-hidden group cursor-pointer">
                            <div className="flex items-center justify-between relative z-10">
                                <span className="text-[10px] font-bold text-black/60 uppercase tracking-widest">
                                    {t('dashboard.stats.total_products')}
                                </span>
                                <div className="p-2 bg-black/5 rounded-full">
                                    <Package size={16} className="text-black" />
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-black tracking-tighter">
                                        {totalProducts.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-bold text-black/60 uppercase">Items</span>
                                </div>
                                <div className="mt-1">
                                    <span className="text-[10px] font-bold text-black/60 uppercase tracking-widest">
                                        {lowStockProducts.length} {t('dashboard.stats.low_stock')}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Unified Top Products Carousel Card */}
                    <div className="rounded-[3rem] p-8 min-h-[400px] flex-1 flex flex-col relative overflow-hidden transition-all duration-700">
                        {/* Dynamic Background Overlays */}
                        {topProducts.length > 0 ? (
                            topProducts.map((product, idx) => (
                                <div
                                    key={`bg-${product.name}`}
                                    className={cn(
                                        'absolute inset-0 transition-opacity duration-1000 ease-in-out',
                                        RANK_COLORS[idx]?.color ?? 'bg-zinc-100',
                                        idx === activeProductIndex ? 'opacity-100' : 'opacity-0',
                                    )}
                                />
                            ))
                        ) : (
                            <div className="absolute inset-0 bg-zinc-100" />
                        )}

                        <div className="flex items-start justify-between mb-8 relative z-20">
                            <div>
                                <h2 className="text-[2rem] font-bold text-black uppercase tracking-tight leading-none">
                                    {t('dashboard.top_performance.title')}
                                </h2>
                                <p className="text-[10px] text-black/40 uppercase tracking-[0.2em] mt-2">
                                    {t('dashboard.top_performance.subtitle')}
                                </p>
                            </div>
                            <span className="text-[10px] text-black bg-emerald-500/10 px-2 py-1 rounded-full uppercase">
                                {t('dashboard.top_performance.badge')}
                            </span>
                        </div>

                        <div className="relative flex-1 flex flex-col items-center justify-center z-10">
                            {topProducts.length > 0 ? (
                                topProducts.map((product, idx) => (
                                    <div
                                        key={product.name}
                                        className={cn(
                                            'absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-in-out',
                                            idx === activeProductIndex
                                                ? 'opacity-100 scale-100 translate-y-0'
                                                : 'opacity-0 scale-90 translate-y-10 pointer-events-none',
                                        )}
                                    >
                                        {/* Rank Badge + Icon */}
                                        <div className="mb-12 relative">
                                            <Award
                                                size={150}
                                                className={cn(RANK_COLORS[idx]?.iconColor ?? 'text-zinc-400', 'filter')}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-5xl font-black text-black/20">#{idx + 1}</span>
                                            </div>
                                        </div>

                                        {/* Product Info */}
                                        <div className="text-center">
                                            <h3 className="text-4xl font-black text-black tracking-tight mb-4">
                                                {product.name}
                                            </h3>
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="px-6 py-2">
                                                    <span className="text-3xl text-black">
                                                        +{formatCurrency(product.profit, false)} {getCurrencySymbol()}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-black/50 uppercase tracking-widest mt-2">
                                                    {t('dashboard.top_performance.monthly_profit')}
                                                </span>
                                                <span className="text-[10px] text-black/30 uppercase tracking-wider">
                                                    {product.total_sold} units sold
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Award size={80} className="text-black/10 mb-4" />
                                    <p className="text-lg font-semibold text-black/40">No sales data this month</p>
                                    <p className="text-sm text-black/25 mt-1">Make sales to see your top performers</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination Dots */}
                        <div className="flex items-center justify-center gap-2 mt-8 relative z-20">
                            {topProducts.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveProductIndex(idx)}
                                    className={cn(
                                        'h-1 rounded-full transition-all duration-300',
                                        idx === activeProductIndex ? 'w-12 bg-black' : 'w-2 bg-black/10',
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
