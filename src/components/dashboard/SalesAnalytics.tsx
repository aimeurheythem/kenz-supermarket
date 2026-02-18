import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import { SaleRepo } from '../../../database/repositories/sale.repo';

type TimeRange = 'hourly' | 'daily' | 'monthly';

interface SalesAnalyticsProps {
    userId?: number;
}

export default function SalesAnalytics({ userId }: SalesAnalyticsProps) {
    const { t, i18n } = useTranslation();
    const [timeRange, setTimeRange] = useState<TimeRange>('hourly');

    // Real data states
    const [hourlyData, setHourlyData] = useState<{ time: string; revenue: number }[]>([]);
    const [dailyData, setDailyData] = useState<{ day: string; revenue: number }[]>([]);
    const [monthlyData, setMonthlyData] = useState<{ month: string; revenue: number }[]>([]);
    const [peakHoursData, setPeakHoursData] = useState<{ hour: string; density: number }[]>([]);

    // Fetch all analytics data on mount and when userId changes
    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                const [hourly, daily, monthly, peaks] = await Promise.all([
                    SaleRepo.getHourlyRevenue(userId),
                    SaleRepo.getDailyRevenue(userId),
                    SaleRepo.getMonthlyRevenue(userId),
                    SaleRepo.getPeakHours(userId),
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
    }, [userId]);

    const chartConfig = {
        revenue: {
            label: t('dashboard.analytics.revenue_label'),
            color: "#BCFF2F",
        },
        density: {
            label: t('dashboard.analytics.density_label'),
            color: "#000000",
        }
    };

    const getRevenueData = () => {
        switch (timeRange) {
            case 'hourly': return hourlyData;
            case 'daily': return dailyData;
            case 'monthly': return monthlyData;
        }
    };

    const getDataKey = () => timeRange === 'hourly' ? 'time' : (timeRange === 'daily' ? 'day' : 'month');

    // Calculate peak hour for the recommendation card
    const peakHour = peakHoursData.reduce<{ hour: string; density: number } | null>(
        (max, curr) => (!max || curr.density > max.density) ? curr : max,
        null
    );
    const totalTodaySales = peakHoursData.reduce((sum, h) => sum + h.density, 0);

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
                                <ChevronDown size={14} className="text-black/40 group-hover:text-black transition-colors" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[150px] rounded-xl p-1 shadow-xl border-zinc-100 bg-white">
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
                                tickFormatter={(value) => value.slice(0, 3)}
                                className="text-[10px] font-bold fill-black/40 uppercase tracking-wider"
                            />
                            <YAxis
                                hide={true}
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

                {/* Subtle Background Decoration */}
                <div className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none rotate-90">
                    <span className="text-[140px] font-black tracking-tighter uppercase italic">Analytics</span>
                </div>
            </Card>

            {/* Peak Hours Card */}
            <Card className="bg-blue-400 p-6 rounded-[3rem] relative overflow-hidden group">
                <CardHeader className="p-0 mb-15 relative z-10">
                    <CardTitle className="text-xl font-bold text-white uppercase tracking-tight leading-none">
                        {t('dashboard.analytics.peak_hours_title')}
                    </CardTitle>
                    <CardDescription className="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-2">
                        {t('dashboard.analytics.peak_hours_subtitle')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 relative z-10">
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                        <BarChart data={peakHoursData}>
                            <XAxis
                                dataKey="hour"
                                axisLine={false}
                                tickLine={false}
                                tickMargin={10}
                                className="text-[10px] font-bold fill-white/60 uppercase tracking-wider"
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
                                barSize={12}
                                animationDuration={1500}
                            />
                        </BarChart>
                    </ChartContainer>

                    <div className="mt-6 flex items-center justify-between p-2.5 rounded-[1.5rem] bg-[#ffee00ff]">
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold text-black tracking-widest">
                                {peakHour ? t('dashboard.analytics.peak_hours_title') : t('dashboard.analytics.recommended_staff')}
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
