import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useSaleStore } from '@/stores/useSaleStore';

type TimeRange = 'hourly' | 'daily' | 'monthly';
type PeakPeriod = 1 | 2 | 3;

interface SalesAnalyticsProps {
    userId?: number;
}

export default function SalesAnalytics({ userId }: SalesAnalyticsProps) {
    const { t, i18n } = useTranslation();
    const [timeRange, setTimeRange] = useState<TimeRange>('hourly');
    const [selectedPeakPeriod, setSelectedPeakPeriod] = useState<PeakPeriod>(() => {
        const hour = new Date().getHours();
        if (hour >= 1 && hour <= 8) return 1;
        if (hour >= 9 && hour <= 16) return 2;
        return 3;
    });

    // Real data states
    const [hourlyData, setHourlyData] = useState<{ time: string; revenue: number }[]>([]);
    const [dailyData, setDailyData] = useState<{ day: string; revenue: number }[]>([]);
    const [monthlyData, setMonthlyData] = useState<{ month: string; revenue: number }[]>([]);
    const [peakHoursData, setPeakHoursData] = useState<{ hour: string; density: number }[]>([]);

    const { getHourlyRevenue, getDailyRevenue, getMonthlyRevenue, getPeakHours } = useSaleStore();

    // Fetch all analytics data on mount and when userId changes
    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                const [hourly, daily, monthly, peaks] = await Promise.all([
                    getHourlyRevenue(userId),
                    getDailyRevenue(userId),
                    getMonthlyRevenue(userId),
                    getPeakHours(userId),
                ]);
                setHourlyData(hourly);
                setDailyData(daily);
                setMonthlyData(monthly);
                setPeakHoursData(peaks);
            } catch (err) {
                console.error('Failed to load analytics:', err);
            }
        };
        loadAnalytics();
    }, [userId, getHourlyRevenue, getDailyRevenue, getMonthlyRevenue, getPeakHours]);

    const chartConfig = {
        revenue: {
            label: t('dashboard.analytics.revenue_label'),
            color: '#BCFF2F',
        },
        density: {
            label: t('dashboard.analytics.density_label'),
            color: '#000000',
        },
    };

    const getRevenueData = () => {
        switch (timeRange) {
            case 'hourly':
                return hourlyData;
            case 'daily':
                return dailyData;
            case 'monthly':
                return monthlyData;
        }
    };

    const getDataKey = () => (timeRange === 'hourly' ? 'time' : timeRange === 'daily' ? 'day' : 'month');

    // Create data for selected 8-hour period
    const fullHourlyData = useMemo(() => {
        let startHour: number;
        if (selectedPeakPeriod === 1) {
            startHour = 1; // 1:00 AM - 8:00 AM
        } else if (selectedPeakPeriod === 2) {
            startHour = 9; // 9:00 AM - 4:00 PM
        } else {
            startHour = 17; // 5:00 PM - 12:00 AM
        }

        const hours = [];
        for (let i = 0; i < 8; i++) {
            const hour = startHour + i;
            const hourStr = hour.toString().padStart(2, '0') + ':00';
            const existing = peakHoursData.find((h) => h.hour === hourStr);
            hours.push({
                hour: hourStr,
                density: existing ? existing.density : 0,
            });
        }
        return hours;
    }, [peakHoursData, selectedPeakPeriod]);

    // Calculate peak hour for the recommendation card
    const peakHour = useMemo(
        () =>
            fullHourlyData.reduce<{ hour: string; density: number } | null>(
                (max, curr) => (!max || curr.density > max.density ? curr : max),
                null,
            ),
        [fullHourlyData],
    );
    const totalTodaySales = useMemo(() => fullHourlyData.reduce((sum, h) => sum + h.density, 0), [fullHourlyData]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Analytics Card */}
            <Card className="lg:col-span-2 p-6 relative overflow-hidden border-none shadow-none">
                <CardHeader className="flex flex-row items-start justify-between p-0 mb-8 relative z-10">
                    <div>
                        <CardTitle className="text-2xl font-bold text-black uppercase tracking-tight leading-none">
                            {t('dashboard.analytics.revenue_title')}
                        </CardTitle>
                        <CardDescription className="text-[10px] text-black/40 uppercase tracking-[0.2em] mt-2">
                            {t('dashboard.analytics.revenue_subtitle')}
                        </CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="outline-none border-none ring-0 focus:ring-0 focus:outline-none focus:ring-offset-0 focus-visible:ring-0 focus-visible:outline-none">
                            <div className="flex items-center gap-2 bg-zinc-200 hover:bg-zinc-300 transition-colors px-4 py-2 rounded-full cursor-pointer group outline-none ring-0">
                                <span
                                    className="text-xs font-bold text-black uppercase tracking-wider"
                                    style={{ fontFamily: i18n.language === 'ar' ? '"Cairo", sans-serif' : 'inherit' }}
                                >
                                    {timeRange === 'hourly' && t('dashboard.analytics.today')}
                                    {timeRange === 'daily' && t('dashboard.analytics.seven_days')}
                                    {timeRange === 'monthly' && t('dashboard.analytics.month')}
                                </span>
                                <ChevronDown
                                    size={14}
                                    className="text-black/40 group-hover:text-black transition-colors"
                                />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-[150px] rounded-xl p-1 shadow-xl border-zinc-100 bg-white"
                        >
                            <DropdownMenuItem
                                onClick={() => setTimeRange('hourly')}
                                className="rounded-lg text-xs font-medium cursor-pointer py-2 focus:bg-zinc-100 outline-none border-none ring-0 focus:ring-0 focus-visible:ring-0"
                                style={{ fontFamily: i18n.language === 'ar' ? '"Cairo", sans-serif' : 'inherit' }}
                            >
                                {t('dashboard.analytics.today')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setTimeRange('daily')}
                                className="rounded-lg text-xs font-medium cursor-pointer py-2 focus:bg-zinc-100 outline-none border-none ring-0 focus:ring-0 focus-visible:ring-0"
                                style={{ fontFamily: i18n.language === 'ar' ? '"Cairo", sans-serif' : 'inherit' }}
                            >
                                {t('dashboard.analytics.seven_days')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setTimeRange('monthly')}
                                className="rounded-lg text-xs font-medium cursor-pointer py-2 focus:bg-zinc-100 outline-none border-none ring-0 focus:ring-0 focus-visible:ring-0"
                                style={{ fontFamily: i18n.language === 'ar' ? '"Cairo", sans-serif' : 'inherit' }}
                            >
                                {t('dashboard.analytics.month')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="p-0 relative z-10">
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <AreaChart data={getRevenueData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00fff2ff" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00fff2ff" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                            <XAxis
                                dataKey={getDataKey()}
                                axisLine={false}
                                tickLine={false}
                                tickMargin={10}
                                tickFormatter={(value) =>
                                    timeRange === 'hourly' ? value.replace(':00', 'h') : value.slice(0, 3)
                                }
                                className="text-[10px] font-bold fill-black/40"
                            />
                            <YAxis
                                hide={false}
                                tickFormatter={(value) => formatCurrency(Number(value))}
                                className="text-[10px] font-bold fill-black/40"
                            />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        indicator="line"
                                        className="w-[150px] bg-white/80 backdrop-blur-sm shadow-xl border-zinc-100/50"
                                        formatter={(value: any) => formatCurrency(Number(value))}
                                    />
                                }
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#00fff2ff"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                animationDuration={1000}
                                animationEasing="ease-in-out"
                            />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Peak Hours Card */}
            <Card className="bg-blue-400 p-6 rounded-[3rem] relative overflow-hidden group">
                <CardHeader className="p-0 mb-15 relative z-10">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold text-white uppercase tracking-tight leading-none">
                            {t('dashboard.analytics.peak_hours_title')}
                        </CardTitle>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="text-[10px] font-bold text-white/60 uppercase tracking-wider bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors">
                                    {selectedPeakPeriod === 1
                                        ? '01:00 - 08:00'
                                        : selectedPeakPeriod === 2
                                            ? '09:00 - 16:00'
                                            : '17:00 - 00:00'}
                                    <ChevronDown size={12} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="rounded-xl p-1 shadow-xl border-white/10 bg-white"
                            >
                                <DropdownMenuItem
                                    onClick={() => setSelectedPeakPeriod(1)}
                                    className="cursor-pointer text-xs font-medium rounded-lg focus:bg-blue-100"
                                >
                                    <span className={selectedPeakPeriod === 1 ? 'font-bold' : ''}>01:00 - 08:00</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setSelectedPeakPeriod(2)}
                                    className="cursor-pointer text-xs font-medium rounded-lg focus:bg-blue-100"
                                >
                                    <span className={selectedPeakPeriod === 2 ? 'font-bold' : ''}>09:00 - 16:00</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setSelectedPeakPeriod(3)}
                                    className="cursor-pointer text-xs font-medium rounded-lg focus:bg-blue-100"
                                >
                                    <span className={selectedPeakPeriod === 3 ? 'font-bold' : ''}>17:00 - 00:00</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <CardDescription className="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-2">
                        {t('dashboard.analytics.peak_hours_subtitle')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 relative z-10">
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                        <BarChart data={fullHourlyData}>
                            <XAxis
                                dataKey="hour"
                                axisLine={false}
                                tickLine={false}
                                tickMargin={10}
                                tick={{ fill: '#ffffff', fontSize: 10, fontWeight: 'bold' }}
                            />
                            <ChartTooltip
                                cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                content={
                                    <ChartTooltipContent
                                        className="bg-white/90 backdrop-blur-sm text-black border-none shadow-xl w-[150px]"
                                        labelFormatter={(value) => `${t('dashboard.analytics.time_label')}: ${value}`}
                                    />
                                }
                            />
                            <Bar
                                dataKey="density"
                                fill="#ffee00ff"
                                radius={[6, 6, 0, 0]}
                                barSize={28}
                                animationDuration={1500}
                            />
                        </BarChart>
                    </ChartContainer>

                    <div className="mt-6 flex items-center justify-between p-2.5 rounded-[1.5rem] bg-[#ffee00ff]">
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold text-black tracking-widest">
                                {peakHour
                                    ? t('dashboard.analytics.peak_hours_title')
                                    : t('dashboard.analytics.recommended_staff')}
                            </span>
                            <span className="text-xl font-bold text-black mt-1">
                                {peakHour ? `${peakHour.hour} — ${peakHour.density} sales` : `${totalTodaySales} sales`}
                            </span>
                        </div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center">
                            <span className="text-black font-black text-xs">{totalTodaySales}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
